// @flow

import backboard from 'backboard';
import Promise from 'bluebird';
import _ from 'underscore';
import {Cache, connectLeague, idb} from '../db';
import {PHASE, PHASE_TEXT, PLAYER} from '../../common';
import g from '../../globals';
import * as api from '../api';
import * as draft from './draft';
import * as finances from './finances';
import * as freeAgents from './freeAgents';
import * as game from './game';
import * as phase from './phase';
import * as player from './player';
import * as season from './season';
import * as team from './team';
import * as helpers from '../../util/helpers';
import {random, updatePhase, updateStatus} from '../util';
import type {GameAttributeKeyDynamic, GameAttributes} from '../../common/types';

const defaultGameAttributes: GameAttributes = {
    phase: 0,
    nextPhase: null, // Used only for fantasy draft
    daysLeft: 0, // Used only for free agency
    gamesInProgress: false,
    phaseChangeInProgress: false,
    stopGames: false,
    lastDbChange: 0,
    ownerMood: {
        wins: 0,
        playoffs: 0,
        money: 0,
    },
    gameOver: false,
    showFirstOwnerMessage: true, // true when user starts with a new team, so initial owner message can be shown
    autoPlaySeasons: 0,
    godMode: false,
    godModeInPast: false,
    salaryCap: 90000, // [thousands of dollars]
    minPayroll: 60000, // [thousands of dollars]
    luxuryPayroll: 100000, // [thousands of dollars]
    luxuryTax: 1.5,
    minContract: 750, // [thousands of dollars]
    maxContract: 30000, // [thousands of dollars]
    minRosterSize: 10,
    numGames: 82, // per season
    quarterLength: 12, // [minutes]
    disableInjuries: false,
    confs: [
        {cid: 0, name: "Eastern Conference"},
        {cid: 1, name: "Western Conference"},
    ],
    divs: [
        {did: 0, cid: 0, name: "Atlantic"},
        {did: 1, cid: 0, name: "Central"},
        {did: 2, cid: 0, name: "Southeast"},
        {did: 3, cid: 1, name: "Southwest"},
        {did: 4, cid: 1, name: "Northwest"},
        {did: 5, cid: 1, name: "Pacific"},
    ],
    numPlayoffRounds: 4,
};

// x and y are both arrays of objects with the same length. For each object, any properties in y but not x will be copied over to x.
function merge(x: Object[], y: Object[]): Object[] {
    for (let i = 0; i < x.length; i++) {
        // Fill in default values as needed
        for (const prop of Object.keys(y[i])) {
            if (!x[i].hasOwnProperty(prop)) {
                x[i][prop] = y[i][prop];
            }
        }
    }

    return x;
}

/**
 * Set values in the gameAttributes objectStore and update the global variable g.
 *
 * Items stored in gameAttributes are globally available through the global variable g. If a value is a constant across all leagues/games/whatever, it should just be set in globals.js instead.
 *
 * @param {Object} gameAttributes Each property in the object will be inserted/updated in the database with the key of the object representing the key in the database.
 * @returns {Promise} Promise for when it finishes.
 */
async function setGameAttributes(gameAttributes: GameAttributes) {
    const toUpdate = [];
    for (const key of helpers.keys(gameAttributes)) {
        if (g[key] !== gameAttributes[key]) {
            toUpdate.push(key);
        }
    }

    await Promise.all(toUpdate.map(async (key) => {
        await g.cache.put('gameAttributes', {
            key,
            value: gameAttributes[key],
        });

        g[key] = gameAttributes[key];
    }));

    if (toUpdate.includes('userTid') || toUpdate.includes('userTids')) {
        api.emit('updateMultiTeam');
    }
}

// Call this after doing DB stuff so other tabs know there is new data.
// Runs in its own transaction, shouldn't be waited for because this only influences other tabs
function updateLastDbChange() {
    setGameAttributes({lastDbChange: Date.now()});
}

/**
 * Create a new league.
 *
 * @memberOf core.league
 * @param {string} name The name of the league.
 * @param {number} tid The team ID for the team the user wants to manage (or -1 for random).
 */
async function create(
    name: string,
    tid: number,
    leagueFile: Object = {},
    startingSeason: number,
    randomizeRosters: boolean,
): Promise<number> {
    const teamsDefault = helpers.getTeamsDefault();

    // Any custom teams?
    let teams: any;
    if (leagueFile.hasOwnProperty("teams")) {
        if (leagueFile.teams.length <= teamsDefault.length) {
            // This probably shouldn't be here, but oh well, backwards compatibility...
            teams = merge(leagueFile.teams, teamsDefault);
        } else {
            teams = leagueFile.teams;
        }
        teams = helpers.addPopRank(teams);
    } else {
        teams = teamsDefault;
    }

    // Handle random team
    if (tid === -1) {
        tid = random.randInt(0, teams.length - 1);
    }

    let phaseText;
    if (leagueFile.hasOwnProperty("meta") && leagueFile.meta.hasOwnProperty("phaseText")) {
        phaseText = leagueFile.meta.phaseText;
    } else {
        phaseText = "";
    }

    g.lid = await idb.meta.leagues.add({
        name,
        tid,
        phaseText,
        teamName: teams[tid].name,
        teamRegion: teams[tid].region,
    });
    idb.league = await connectLeague(g.lid);

    const gameAttributes = _.extend(helpers.deepCopy(defaultGameAttributes), {
        userTid: tid,
        userTids: [tid],
        season: startingSeason,
        startingSeason,
        leagueName: name,
        teamAbbrevsCache: teams.map(t => t.abbrev),
        teamRegionsCache: teams.map(t => t.region),
        teamNamesCache: teams.map(t => t.name),
        gracePeriodEnd: startingSeason + 2, // Can't get fired for the first two seasons
        numTeams: teams.length, // Will be 30 if the user doesn't supply custom rosters
    });

    // gameAttributes from input
    let skipNewPhase = false;
    if (leagueFile.hasOwnProperty("gameAttributes")) {
        for (let i = 0; i < leagueFile.gameAttributes.length; i++) {
            // Set default for anything except team ID and name, since they can be overwritten by form input.
            if (leagueFile.gameAttributes[i].key !== "userTid" && leagueFile.gameAttributes[i].key !== "leagueName") {
                gameAttributes[leagueFile.gameAttributes[i].key] = leagueFile.gameAttributes[i].value;
            }

            if (leagueFile.gameAttributes[i].key === "phase") {
                skipNewPhase = true;
            }
        }

        // Special case for userTids - don't use saved value if userTid is not in it
        if (!gameAttributes.userTids.includes(gameAttributes.userTid)) {
            gameAttributes.userTids = [gameAttributes.userTid];
        }
    }

    // Clear old game attributes from g, to make sure the new ones are saved to the db in setGameAttributes
    helpers.resetG();

    g.cache = new Cache();
    g.cache.newLeague = true;
    await g.cache.fill(gameAttributes.season);

    await setGameAttributes(gameAttributes);

    let players;
    let scoutingRankTemp;

    // Draft picks for the first 4 years, as those are the ones can be traded initially
    if (leagueFile.hasOwnProperty("draftPicks")) {
        for (let i = 0; i < leagueFile.draftPicks.length; i++) {
            await g.cache.add('draftPicks', leagueFile.draftPicks[i]);
        }
    } else {
        for (let i = 0; i < 4; i++) {
            for (let t = 0; t < g.numTeams; t++) {
                for (let round = 1; round <= 2; round++) {
                    await g.cache.add('draftPicks', {
                        tid: t,
                        originalTid: t,
                        round,
                        season: g.startingSeason + i,
                    });
                }
            }
        }
    }

    // Initialize draft order object store for later use
    if (leagueFile.hasOwnProperty("draftOrder")) {
        for (let i = 0; i < leagueFile.draftOrder.length; i++) {
            await g.cache.add('draftOrder', leagueFile.draftOrder[i]);
        }
    } else {
        await g.cache.add('draftOrder', {
            rid: 0,
            draftOrder: [],
        });
    }

    // teams already contains tid, cid, did, region, name, and abbrev. Let's add in the other keys we need for the league.
    for (let i = 0; i < g.numTeams; i++) {
        const t = team.generate(teams[i]);
        await g.cache.add('teams', t);

        let teamSeasons;
        if (teams[i].hasOwnProperty("seasons")) {
            teamSeasons = teams[i].seasons;
        } else {
            teamSeasons = [team.genSeasonRow(t.tid)];
            teamSeasons[0].pop = teams[i].pop;
        }
        for (const teamSeason of teamSeasons) {
            teamSeason.tid = t.tid;
            await g.cache.add('teamSeasons', teamSeason);
        }

        let teamStats;
        if (teams[i].hasOwnProperty("stats")) {
            teamStats = teams[i].stats;
        } else {
            teamStats = [team.genStatsRow(t.tid)];
        }
        for (const teamStat of teamStats) {
            teamStat.tid = t.tid;
            if (!teamStat.hasOwnProperty("ba")) {
                teamStat.ba = 0;
            }
            await g.cache.add('teamStats', teamStat);
        }

        // Save scoutingRank for later
        if (i === g.userTid) {
            scoutingRankTemp = finances.getRankLastThree(teamSeasons, "expenses", "scouting");
        }
    }
    const scoutingRank = scoutingRankTemp;
    if (scoutingRank === undefined) {
        throw new Error('scoutingRank should be defined');
    }

    if (leagueFile.hasOwnProperty("trade")) {
        for (let i = 0; i < leagueFile.trade.length; i++) {
            await g.cache.add('trade', leagueFile.trade[i]);
        }
    } else {
        await g.cache.add('trade', {
            rid: 0,
            teams: [{
                tid,
                pids: [],
                dpids: [],
            },
            {
                tid: tid === 0 ? 1 : 0,  // Load initial trade view with the lowest-numbered non-user team (so, either 0 or 1).
                pids: [],
                dpids: [],
            }],
        });
    }

    // Fix missing +/-, blocks against in boxscore
    if (leagueFile.hasOwnProperty("games")) {
        for (let i = 0; i < leagueFile.games.length; i++) {
            if (!leagueFile.games[i].teams[0].hasOwnProperty("ba")) {
                leagueFile.games[i].teams[0].ba = 0;
                leagueFile.games[i].teams[1].ba = 0;
            }
            for (let j = 0; j < leagueFile.games[i].teams.length; j++) {
                for (let k = 0; k < leagueFile.games[i].teams[j].players.length; k++) {
                    if (!leagueFile.games[i].teams[j].players[k].hasOwnProperty("ba")) {
                        leagueFile.games[i].teams[j].players[k].ba = 0;
                    }
                    if (!leagueFile.games[i].teams[j].players[k].hasOwnProperty("pm")) {
                        leagueFile.games[i].teams[j].players[k].pm = 0;
                    }
                }
            }
        }
    }

    // These object stores are blank by default
    const toMaybeAdd = ["releasedPlayers", "awards", "schedule", "playoffSeries", "negotiations", "messages", "games", "events", "playerFeats"];
    for (let j = 0; j < toMaybeAdd.length; j++) {
        if (leagueFile.hasOwnProperty(toMaybeAdd[j])) {
            for (let i = 0; i < leagueFile[toMaybeAdd[j]].length; i++) {
                await g.cache.add(toMaybeAdd[j], leagueFile[toMaybeAdd[j]][i]);
            }
        }
    }

    const baseMoods = await player.genBaseMoods();

    if (leagueFile.hasOwnProperty("players")) {
        // Use pre-generated players, filling in attributes as needed
        players = leagueFile.players;

        // Does the player want the rosters randomized?
        if (randomizeRosters) {
            // Assign the team ID of all players to the 'playerTids' array.
            // Check tid to prevent draft prospects from being swapped with established players
            const playerTids = players.filter(p => p.tid > PLAYER.FREE_AGENT).map(p => p.tid);

            // Shuffle the teams that players are assigned to.
            random.shuffle(playerTids);
            for (const p of players) {
                if (p.tid > PLAYER.FREE_AGENT) {
                    p.tid = playerTids.pop();
                    if (p.stats && p.stats.length > 0) {
                        p.stats[p.stats.length - 1].tid = p.tid;
                        p.statsTids.push(p.tid);
                    }
                }
            }
        }

        players.forEach(async p0 => {
            // Has to be any because I cna't figure out how to change PlayerWithoutPidWithStats to Player
            const p: any = player.augmentPartialPlayer(p0, scoutingRank);

            // Don't let imported contracts be created for below the league minimum, and round to nearest $10,000.
            p.contract.amount = Math.max(10 * Math.round(p.contract.amount / 10), g.minContract);

            // Separate out stats
            const playerStats = p.stats;
            delete p.stats;

            await player.updateValues(p, playerStats.reverse());
            await g.cache.put('players', p);

            // If no stats in League File, create blank stats rows for active players if necessary
            if (playerStats.length === 0) {
                if (p.tid >= 0 && g.phase <= PHASE.PLAYOFFS) {
                    // Needs pid, so must be called after put. It's okay, statsTid was already set in player.augmentPartialPlayer
                    await player.addStatsRow(p, g.phase === PHASE.PLAYOFFS);
                }
            } else {
                // If there are stats in the League File, add them to the database
                const addStatsRows = async () => {
                    const ps = playerStats.pop();

                    // Augment with pid, if it's not already there - can't be done in player.augmentPartialPlayer because pid is not known at that point
                    ps.pid = p.pid;

                    // Could be calculated correctly if I wasn't lazy
                    if (!ps.hasOwnProperty("yearsWithTeam")) {
                        ps.yearsWithTeam = 1;
                    }

                    // If needed, set missing +/-, blocks against to 0
                    if (!ps.hasOwnProperty("ba")) {
                        ps.ba = 0;
                    }
                    if (!ps.hasOwnProperty("pm")) {
                        ps.pm = 0;
                    }

                    // Delete psid because it can cause problems due to interaction addStatsRow above
                    delete ps.psid;

                    await g.cache.add('playerStats', ps);

                    // On to the next one
                    if (playerStats.length > 0) {
                        await addStatsRows();
                    }
                };
                await addStatsRows();
            }
        });
    } else {
        // No players in league file, so generate new players
        const profiles = ["Point", "Wing", "Big", ""];
        const baseRatings = [37, 37, 36, 35, 34, 33, 32, 31, 30, 29, 28, 26, 26, 26];
        const pots = [75, 65, 55, 55, 60, 50, 70, 40, 55, 50, 60, 60, 45, 45];

        for (let tidTemp = -3; tidTemp < teams.length; tidTemp++) {
            // Create multiple "teams" worth of players for the free agent pool
            const tid2 = tidTemp < 0 ? PLAYER.FREE_AGENT : tidTemp;

            const goodNeutralBad = random.randInt(-1, 1);  // determines if this will be a good team or not
            random.shuffle(pots);
            for (let n = 0; n < 14; n++) {
                const profile = profiles[random.randInt(0, profiles.length - 1)];
                const agingYears = random.randInt(0, 13);
                const draftYear = g.startingSeason - 1 - agingYears;

                const p = player.generate(tid2, 19, profile, baseRatings[n], pots[n], draftYear, true, scoutingRank);
                player.develop(p, agingYears, true);
                if (n < 5) {
                    player.bonus(p, goodNeutralBad * random.randInt(0, 20));
                } else {
                    player.bonus(p, 0);
                }
                if (tid2 === PLAYER.FREE_AGENT) {  // Free agents
                    player.bonus(p, -15);
                }

                // Update player values after ratings changes
                await player.updateValues(p);

                // Randomize contract expiration for players who aren't free agents, because otherwise contract expiration dates will all be synchronized
                const randomizeExp = (p.tid !== PLAYER.FREE_AGENT);

                // Update contract based on development. Only write contract to player log if not a free agent.
                player.setContract(p, player.genContract(p, randomizeExp), p.tid >= 0);

                // Save to database
                await g.cache.add('players', p);

                // Needs pid, so must be called after put
                if (p.tid === PLAYER.FREE_AGENT) {
                    player.addToFreeAgents(p, g.phase, baseMoods);
                } else {
                    // $FlowFixMe
                    await player.addStatsRow(p, g.phase === PHASE.PLAYOFFS);
                }
            }

            // Initialize rebuilding/contending, when possible
            if (tid2 >= 0) {
                const t = await g.cache.get('teams', tid2);
                t.strategy = goodNeutralBad === 1 ? "contending" : "rebuilding";
            }
        }
    }

    // See if imported roster has draft picks included. If so, create less than 70 (scaled for number of teams)
    let createUndrafted1 = Math.round(70 * g.numTeams / 30);
    let createUndrafted2 = Math.round(70 * g.numTeams / 30);
    let createUndrafted3 = Math.round(70 * g.numTeams / 30);
    if (players !== undefined) {
        for (let i = 0; i < players.length; i++) {
            if (players[i].tid === PLAYER.UNDRAFTED) {
                createUndrafted1 -= 1;
            } else if (players[i].tid === PLAYER.UNDRAFTED_2) {
                createUndrafted2 -= 1;
            } else if (players[i].tid === PLAYER.UNDRAFTED_3) {
                createUndrafted3 -= 1;
            }
        }
    }
    // If the draft has already happened this season but next year's class hasn't been bumped up, don't create any PLAYER.UNDRAFTED
    if (createUndrafted1 > 0 && (g.phase <= PHASE.BEFORE_DRAFT || g.phase >= PHASE.FREE_AGENCY)) {
        await draft.genPlayers(PLAYER.UNDRAFTED, scoutingRank, createUndrafted1, true);
    }
    if (createUndrafted2 > 0) {
        await draft.genPlayers(PLAYER.UNDRAFTED_2, scoutingRank, createUndrafted2, true);
    }
    if (createUndrafted3 > 0) {
        await draft.genPlayers(PLAYER.UNDRAFTED_3, scoutingRank, createUndrafted3, true);
    }

    if (skipNewPhase) {
        // Game already in progress, just start it
        return g.lid;
    }

    updatePhase(`${g.season} ${PHASE_TEXT[g.phase]}`);
    updateStatus("Idle");

    const lid = g.lid; // Otherwise, g.lid can be overwritten before the URL redirects, and then we no longer know the league ID

    // Auto sort rosters
    await Promise.all(teams.map(t => team.rosterAutoSort(t.tid)));

    await g.cache.flush();

    helpers.bbgmPing("league");

    return lid;
}

/**
 * Delete an existing league.
 *
 * @memberOf core.league
 * @param {number} lid League ID.
 * @param {function()=} cb Optional callback.
 */
function remove(lid: number) {
    if (idb.league !== undefined) {
        idb.league.close();
    }
    idb.meta.leagues.delete(lid);
    return backboard.delete(`league${lid}`);
}

/**
 * Export existing active league.
 *
 * @memberOf core.league
 * @param {string[]} stores Array of names of objectStores to include in export
 * @return {Promise} Resolve to all the exported league data.
 */
async function exportLeague(stores: string[]) {
    const exportedLeague = {};

    // Row from leagueStore in meta db.
    // phaseText is needed if a phase is set in gameAttributes.
    // name is only used for the file name of the exported roster file.
    exportedLeague.meta = {phaseText: g.phaseText, name: g.leagueName};

    await Promise.all(stores.map(async (store) => {
        exportedLeague[store] = await idb.league[store].getAll();
    }));

    // Move playerStats to players object, similar to old DB structure. Makes editing JSON output nicer.
    if (stores.includes('playerStats')) {
        for (let i = 0; i < exportedLeague.playerStats.length; i++) {
            const pid = exportedLeague.playerStats[i].pid;
            for (let j = 0; j < exportedLeague.players.length; j++) {
                if (exportedLeague.players[j].pid === pid) {
                    if (!exportedLeague.players[j].hasOwnProperty("stats")) {
                        exportedLeague.players[j].stats = [];
                    }
                    exportedLeague.players[j].stats.push(exportedLeague.playerStats[i]);
                    break;
                }
            }
        }

        delete exportedLeague.playerStats;
    }

    if (stores.includes('teams')) {
        for (let i = 0; i < exportedLeague.teamSeasons.length; i++) {
            const tid = exportedLeague.teamSeasons[i].tid;
            for (let j = 0; j < exportedLeague.teams.length; j++) {
                if (exportedLeague.teams[j].tid === tid) {
                    if (!exportedLeague.teams[j].hasOwnProperty("seasons")) {
                        exportedLeague.teams[j].seasons = [];
                    }
                    exportedLeague.teams[j].seasons.push(exportedLeague.teamSeasons[i]);
                    break;
                }
            }
        }

        for (let i = 0; i < exportedLeague.teamStats.length; i++) {
            const tid = exportedLeague.teamStats[i].tid;
            for (let j = 0; j < exportedLeague.teams.length; j++) {
                if (exportedLeague.teams[j].tid === tid) {
                    if (!exportedLeague.teams[j].hasOwnProperty("stats")) {
                        exportedLeague.teams[j].stats = [];
                    }
                    exportedLeague.teams[j].stats.push(exportedLeague.teamStats[i]);
                    break;
                }
            }
        }

        delete exportedLeague.teamSeasons;
        delete exportedLeague.teamStats;
    }

    return exportedLeague;
}

async function updateMetaNameRegion(name: string, region: string) {
    const l = await idb.meta.leagues.get(g.lid);
    l.teamName = name;
    l.teamRegion = region;
    await idb.meta.leagues.put(l);
}

/**
 * Load a game attribute from the database and update the global variable g.
 *
 * @param {(IDBObjectStore|IDBTransaction|null)} ot An IndexedDB object store or transaction on gameAttributes; if null is passed, then a new transaction will be used.
 * @param {string} key Key in gameAttributes to load the value for.
 * @return {Promise}
 */
async function loadGameAttribute(key: GameAttributeKeyDynamic) {
    const gameAttribute = await g.cache.get('gameAttributes', key);

    if (gameAttribute === undefined) {
        throw new Error(`Unknown game attribute: ${key}`);
    }

    g[key] = gameAttribute.value;

    // Set defaults to avoid IndexedDB upgrade
    if (g[key] === undefined && defaultGameAttributes.hasOwnProperty(key)) {
        g[key] = defaultGameAttributes[key];
    }

    // UI stuff - see also loadGameAttributes
    if (key === "godMode") {
        api.emit('updateTopMenu', {godMode: g.godMode});
    }
    if (key === "userTid" || key === "userTids") {
        api.emit('updateMultiTeam');
    }
}

/**
 * Load game attributes from the database and update the global variable g.
 *
 * @return {Promise}
 */
async function loadGameAttributes() {
    const gameAttributes = await g.cache.getAll('gameAttributes');

    for (let i = 0; i < gameAttributes.length; i++) {
        g[gameAttributes[i].key] = gameAttributes[i].value;
    }

    // Shouldn't be necessary, but some upgrades fail http://www.reddit.com/r/BasketballGM/comments/2zwg24/cant_see_any_rosters_on_any_teams_in_any_of_my/cpn0j6w
    if (g.userTids === undefined) { g.userTids = [g.userTid]; }

    // Set defaults to avoid IndexedDB upgrade
    helpers.keys(defaultGameAttributes).forEach(key => {
        if (g[key] === undefined) {
            g[key] = defaultGameAttributes[key];
        }
    });

    // UI stuff - see also loadGameAttribute
    api.emit('updateTopMenu', {godMode: g.godMode});
    api.emit('updateMultiTeam');
}

// Depending on phase, initiate action that will lead to the next phase
async function autoPlay() {
    if (g.phase === PHASE.PRESEASON) {
        await phase.newPhase(PHASE.REGULAR_SEASON);
    } else if (g.phase === PHASE.REGULAR_SEASON) {
        const numDays = await season.getDaysLeftSchedule();
        await game.play(numDays);
    } else if (g.phase === PHASE.PLAYOFFS) {
        await game.play(100);
    } else if (g.phase === PHASE.BEFORE_DRAFT) {
        await phase.newPhase(PHASE.DRAFT);
    } else if (g.phase === PHASE.DRAFT) {
        await draft.untilUserOrEnd();
    } else if (g.phase === PHASE.AFTER_DRAFT) {
        await phase.newPhase(PHASE.RESIGN_PLAYERS);
    } else if (g.phase === PHASE.RESIGN_PLAYERS) {
        await phase.newPhase(PHASE.FREE_AGENCY);
    } else if (g.phase === PHASE.FREE_AGENCY) {
        await freeAgents.play(g.daysLeft);
    } else {
        throw new Error(`Unknown phase: ${g.phase}`);
    }
}

async function initAutoPlay() {
    const result = window.prompt("This will play through multiple seasons, using the AI to manage your team. How many seasons do you want to simulate?", "5");
    const numSeasons = parseInt(result, 10);

    if (Number.isInteger(numSeasons)) {
        await setGameAttributes({autoPlaySeasons: numSeasons});
        autoPlay();
    }
}

export {
    create,
    exportLeague,
    remove,
    setGameAttributes,
    updateMetaNameRegion,
    loadGameAttribute,
    loadGameAttributes,
    updateLastDbChange,
    autoPlay,
    initAutoPlay,
};
