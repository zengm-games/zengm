// @flow

import backboard from "backboard";
import { Cache, connectLeague, idb } from "../db";
import { PHASE, PLAYER, g, helpers } from "../../common";
import {
    draft,
    finances,
    freeAgents,
    game,
    phase,
    player,
    season,
    team,
} from "../core";
import {
    defaultGameAttributes,
    local,
    lock,
    random,
    toUI,
    updatePhase,
    updateStatus,
} from "../util";
import type { Conditions, GameAttributes } from "../../common/types";

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

    for (const key of toUpdate) {
        await idb.cache.gameAttributes.put({
            key,
            value: gameAttributes[key],
        });

        g[key] = gameAttributes[key];
    }

    await toUI(["setGameAttributes", gameAttributes]);
    if (toUpdate.includes("userTid") || toUpdate.includes("userTids")) {
        await toUI(["emit", "updateMultiTeam"]);
    }
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
    randomizeRosters?: boolean = false,
    conditions: Conditions,
): Promise<number> {
    await idb.meta.attributes.put(tid, "lastSelectedTid");

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
    if (tid === -1 || tid >= teams.length) {
        tid = random.randInt(0, teams.length - 1);
    }

    let phaseText;
    if (
        leagueFile.hasOwnProperty("meta") &&
        leagueFile.meta.hasOwnProperty("phaseText")
    ) {
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
        heartbeatID: undefined,
        heartbeatTimestamp: undefined,
    });
    idb.league = await connectLeague(g.lid);

    // These wouldn't be needed here, except the beforeView logic is fucked up
    lock.reset();
    local.reset();

    const gameAttributes = Object.assign({}, defaultGameAttributes, {
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
            if (
                leagueFile.gameAttributes[i].key !== "userTid" &&
                leagueFile.gameAttributes[i].key !== "leagueName"
            ) {
                gameAttributes[leagueFile.gameAttributes[i].key] =
                    leagueFile.gameAttributes[i].value;
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
    await toUI(["resetG"]);

    if (idb.cache) {
        idb.cache.stopAutoFlush();
    }
    idb.cache = new Cache();
    idb.cache.newLeague = true;
    await idb.cache.fill(gameAttributes.season);

    await setGameAttributes(gameAttributes);

    let players;
    let scoutingRankTemp;

    // Draft picks for the first 4 years, as those are the ones can be traded initially
    if (leagueFile.hasOwnProperty("draftPicks")) {
        for (let i = 0; i < leagueFile.draftPicks.length; i++) {
            await idb.cache.draftPicks.add(leagueFile.draftPicks[i]);
        }
    } else {
        for (let i = 0; i < 4; i++) {
            for (let t = 0; t < g.numTeams; t++) {
                for (let round = 1; round <= 2; round++) {
                    await idb.cache.draftPicks.add({
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
        for (const draftOrder of leagueFile.draftOrder) {
            await idb.cache.draftOrder.add(draftOrder);
        }
    } else {
        await idb.cache.draftOrder.add({
            rid: 0,
            draftOrder: [],
        });
    }

    if (leagueFile.hasOwnProperty("draftLotteryResults")) {
        for (const draftLotteryResult of leagueFile.draftLotteryResults) {
            await idb.cache.draftLotteryResults.add(draftLotteryResult);
        }
    }

    // teams already contains tid, cid, did, region, name, and abbrev. Let's add in the other keys we need for the league.
    for (let i = 0; i < g.numTeams; i++) {
        const t = team.generate(teams[i]);
        await idb.cache.teams.add(t);

        let teamSeasons;
        if (teams[i].hasOwnProperty("seasons")) {
            teamSeasons = teams[i].seasons;
        } else {
            teamSeasons = [team.genSeasonRow(t.tid)];
            teamSeasons[0].pop = teams[i].pop;
        }
        for (const teamSeason of teamSeasons) {
            teamSeason.tid = t.tid;
            await idb.cache.teamSeasons.add(teamSeason);
        }

        let teamStats;
        if (teams[i].hasOwnProperty("stats")) {
            teamStats = teams[i].stats;
        } else {
            teamStats = [team.genStatsRow(t.tid)];
        }
        for (const ts of teamStats) {
            ts.tid = t.tid;

            if (ts.hasOwnProperty("ba")) {
                ts.oppBlk = ts.ba;
                delete ts.ba;
            }
            if (typeof ts.oppBlk !== "number" || Number.isNaN(ts.oppBlk)) {
                ts.oppBlk = 0;
            }

            await idb.cache.teamStats.add(ts);
        }

        // Save scoutingRank for later
        if (i === g.userTid) {
            scoutingRankTemp = finances.getRankLastThree(
                teamSeasons,
                "expenses",
                "scouting",
            );
        }
    }
    const scoutingRank = scoutingRankTemp;
    if (scoutingRank === undefined) {
        throw new Error("scoutingRank should be defined");
    }

    if (leagueFile.hasOwnProperty("trade")) {
        for (let i = 0; i < leagueFile.trade.length; i++) {
            await idb.cache.trade.add(leagueFile.trade[i]);
        }
    } else {
        await idb.cache.trade.add({
            rid: 0,
            teams: [
                {
                    tid,
                    pids: [],
                    dpids: [],
                },
                {
                    tid: tid === 0 ? 1 : 0, // Load initial trade view with the lowest-numbered non-user team (so, either 0 or 1).
                    pids: [],
                    dpids: [],
                },
            ],
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
                for (
                    let k = 0;
                    k < leagueFile.games[i].teams[j].players.length;
                    k++
                ) {
                    if (
                        !leagueFile.games[i].teams[j].players[k].hasOwnProperty(
                            "ba",
                        )
                    ) {
                        leagueFile.games[i].teams[j].players[k].ba = 0;
                    }
                    if (
                        !leagueFile.games[i].teams[j].players[k].hasOwnProperty(
                            "pm",
                        )
                    ) {
                        leagueFile.games[i].teams[j].players[k].pm = 0;
                    }
                }
            }
        }
    }

    // These object stores are blank by default
    const toMaybeAdd = [
        "releasedPlayers",
        "awards",
        "schedule",
        "playoffSeries",
        "negotiations",
        "messages",
        "games",
        "events",
        "playerFeats",
    ];
    for (let j = 0; j < toMaybeAdd.length; j++) {
        if (leagueFile.hasOwnProperty(toMaybeAdd[j])) {
            for (let i = 0; i < leagueFile[toMaybeAdd[j]].length; i++) {
                await idb.cache._add(
                    toMaybeAdd[j],
                    leagueFile[toMaybeAdd[j]][i],
                );
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
            const playerTids = players
                .filter(p => p.tid > PLAYER.FREE_AGENT)
                .map(p => p.tid);

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

        for (const p0 of players) {
            // Has to be any because I cna't figure out how to change PlayerWithoutPidWithStats to Player
            const p: any = player.augmentPartialPlayer(
                p0,
                scoutingRank,
                leagueFile.version,
            );

            // Don't let imported contracts be created for below the league minimum, and round to nearest $10,000.
            p.contract.amount = Math.max(
                10 * Math.round(p.contract.amount / 10),
                g.minContract,
            );

            // Separate out stats
            const playerStats = p.stats;
            delete p.stats;

            await player.updateValues(p, playerStats);
            await idb.cache.players.put(p);

            // If no stats in League File, create blank stats rows for active players if necessary
            if (playerStats.length === 0) {
                if (p.tid >= 0 && g.phase <= PHASE.PLAYOFFS) {
                    // Needs pid, so must be called after put. It's okay, statsTid was already set in player.augmentPartialPlayer
                    await player.addStatsRow(p, g.phase === PHASE.PLAYOFFS);
                }
            } else {
                // If there are stats in the League File, add them to the database
                const addStatsRows = async () => {
                    const ps = playerStats.shift();

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

                    await idb.cache.playerStats.add(ps);

                    // On to the next one
                    if (playerStats.length > 0) {
                        await addStatsRows();
                    }
                };
                await addStatsRows();
            }
        }
    } else {
        // Generate past 20 years of draft classes
        const NUM_PAST_SEASONS = 20;

        let newPlayers = [];
        for (let i = 0; i < NUM_PAST_SEASONS; i++) {
            const draftClass = await draft.genPlayersWithoutSaving(
                PLAYER.UNDRAFTED,
                scoutingRank,
            );
            newPlayers = newPlayers.concat(draftClass.players);
        }
        const numPlayersPerSeason = Math.round(
            newPlayers.length / NUM_PAST_SEASONS,
        );

        // Develop players, check retire
        const keptPlayers = [];
        let agingYears = 0;
        for (let i = 0; i < newPlayers.length; i++) {
            if (i % numPlayersPerSeason === 0) {
                agingYears += 1;
            }
            const p = newPlayers[i];
            player.develop(p, agingYears, true);
            p.draft.year -= agingYears;
            await player.updateValues(p);

            if (!player.shouldRetire(p)) {
                keptPlayers.push(p);
            }
        }

        // 16 instead of 13 for wiggle room (need min contract FAs sometimes)
        if (keptPlayers.length < 16 * g.numTeams) {
            throw new Error("Not enough players!");
        }

        // Add players to teams or free agency
        keptPlayers.sort((a, b) => b.ratings[0].pot - a.ratings[0].pot);
        const teamPlayers = keptPlayers.slice(0, 13 * g.numTeams);
        const freeAgentPlayers = keptPlayers.slice(
            13 * g.numTeams,
            150 + 13 * g.numTeams,
        ); // Up to 150 free agents
        random.shuffle(teamPlayers);
        let newTid = -1; // So first iteration will be 0
        for (let i = 0; i < teamPlayers.length; i++) {
            if (i % 13 === 0) {
                newTid += 1;
            }
            const p = teamPlayers[i];
            p.tid = newTid;
            player.setContract(p, player.genContract(p, true), true);
            await idb.cache.players.add(p); // Needed before addStatsRow
            await player.addStatsRow(p, g.phase === PHASE.PLAYOFFS);
        }
        for (let i = 0; i < freeAgentPlayers.length; i++) {
            const p = freeAgentPlayers[i];
            p.yearsFreeAgent = Math.random() > 0.5 ? 1 : 0; // So half will be eligible to retire after the first season
            player.setContract(p, player.genContract(p, false), false);
            // No add needed in this branch because addToFreeAgents has put
            await player.addToFreeAgents(p, g.phase, baseMoods);
        }
    }

    // See if imported roster has draft picks included. If so, create less than 70 (scaled for number of teams)
    let createUndrafted1 = Math.round(70 * g.numTeams / 30);
    let createUndrafted2 = Math.round(70 * g.numTeams / 30);
    let createUndrafted3 = Math.round(70 * g.numTeams / 30);
    if (players !== undefined) {
        for (const p of players) {
            if (p.tid === PLAYER.UNDRAFTED) {
                createUndrafted1 -= 1;
            } else if (p.tid === PLAYER.UNDRAFTED_2) {
                createUndrafted2 -= 1;
            } else if (p.tid === PLAYER.UNDRAFTED_3) {
                createUndrafted3 -= 1;
            }
        }
    }
    // If the draft has already happened this season but next year's class hasn't been bumped up, don't create any PLAYER.UNDRAFTED
    if (
        createUndrafted1 > 0 &&
        (g.phase <= PHASE.DRAFT_LOTTERY || g.phase >= PHASE.FREE_AGENCY)
    ) {
        await draft.genPlayers(
            PLAYER.UNDRAFTED,
            scoutingRank,
            createUndrafted1,
            true,
        );
    }
    if (createUndrafted2 > 0) {
        await draft.genPlayers(
            PLAYER.UNDRAFTED_2,
            scoutingRank,
            createUndrafted2,
            true,
        );
    }
    if (createUndrafted3 > 0) {
        await draft.genPlayers(
            PLAYER.UNDRAFTED_3,
            scoutingRank,
            createUndrafted3,
            true,
        );
    }

    const lid = g.lid; // Otherwise, g.lid can be overwritten before the URL redirects, and then we no longer know the league ID

    if (!skipNewPhase) {
        await updatePhase();
        await updateStatus("Idle");

        // Auto sort rosters
        await Promise.all(teams.map(t => team.rosterAutoSort(t.tid)));
    }

    await idb.cache.flush();
    idb.cache.startAutoFlush();

    toUI(["bbgmPing", "league"], conditions);

    return lid;
}

/**
 * Export existing active league.
 *
 * @memberOf core.league
 * @param {string[]} stores Array of names of objectStores to include in export
 * @return {Promise} Resolve to all the exported league data.
 */
async function exportLeague(stores: string[]) {
    // Always flush before export, so export is current!
    await idb.cache.flush();

    const exportedLeague: any = {
        version: idb.league.version,
    };

    // Row from leagueStore in meta db.
    // phaseText is needed if a phase is set in gameAttributes.
    // name is only used for the file name of the exported roster file.
    exportedLeague.meta = { phaseText: local.phaseText, name: g.leagueName };

    await Promise.all(
        stores.map(async store => {
            exportedLeague[store] = await idb.league[store].getAll();
        }),
    );

    // Move playerStats to players object, similar to old DB structure. Makes editing JSON output nicer.
    if (stores.includes("playerStats")) {
        for (let i = 0; i < exportedLeague.playerStats.length; i++) {
            const pid = exportedLeague.playerStats[i].pid;
            for (let j = 0; j < exportedLeague.players.length; j++) {
                if (exportedLeague.players[j].pid === pid) {
                    if (!exportedLeague.players[j].hasOwnProperty("stats")) {
                        exportedLeague.players[j].stats = [];
                    }
                    exportedLeague.players[j].stats.push(
                        exportedLeague.playerStats[i],
                    );
                    break;
                }
            }
        }

        delete exportedLeague.playerStats;
    }

    if (stores.includes("teams")) {
        for (let i = 0; i < exportedLeague.teamSeasons.length; i++) {
            const tid = exportedLeague.teamSeasons[i].tid;
            for (let j = 0; j < exportedLeague.teams.length; j++) {
                if (exportedLeague.teams[j].tid === tid) {
                    if (!exportedLeague.teams[j].hasOwnProperty("seasons")) {
                        exportedLeague.teams[j].seasons = [];
                    }
                    exportedLeague.teams[j].seasons.push(
                        exportedLeague.teamSeasons[i],
                    );
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
                    exportedLeague.teams[j].stats.push(
                        exportedLeague.teamStats[i],
                    );
                    break;
                }
            }
        }

        delete exportedLeague.teamSeasons;
        delete exportedLeague.teamStats;
    }

    // Set startingSeason if gameAttributes is not selected, otherwise it's going to fail loading unless startingSeason is coincidentally the same as the default
    if (!stores.includes("gameAttributes")) {
        exportedLeague.startingSeason = g.startingSeason;
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
 * Load game attributes from the database and update the global variable g.
 *
 * @return {Promise}
 */
async function loadGameAttributes() {
    const gameAttributes = await idb.cache.gameAttributes.getAll();

    for (let i = 0; i < gameAttributes.length; i++) {
        g[gameAttributes[i].key] = gameAttributes[i].value;
    }

    // Shouldn't be necessary, but some upgrades fail http://www.reddit.com/r/BasketballGM/comments/2zwg24/cant_see_any_rosters_on_any_teams_in_any_of_my/cpn0j6w
    if (g.userTids === undefined) {
        g.userTids = [g.userTid];
    }

    // Set defaults to avoid IndexedDB upgrade
    helpers.keys(defaultGameAttributes).forEach(key => {
        if (g[key] === undefined) {
            g[key] = defaultGameAttributes[key];
        }
    });

    await toUI(["setGameAttributes", g]);

    // UI stuff
    toUI(["emit", "updateTopMenu", { godMode: g.godMode }]);
    toUI(["emit", "updateMultiTeam"]);
}

// Depending on phase, initiate action that will lead to the next phase
async function autoPlay(conditions: Conditions) {
    if (g.phase === PHASE.PRESEASON) {
        await phase.newPhase(PHASE.REGULAR_SEASON, conditions);
    } else if (g.phase === PHASE.REGULAR_SEASON) {
        const numDays = await season.getDaysLeftSchedule();
        await game.play(numDays, conditions);
    } else if (g.phase === PHASE.PLAYOFFS) {
        await game.play(100, conditions);
    } else if (g.phase === PHASE.DRAFT_LOTTERY) {
        await phase.newPhase(PHASE.DRAFT, conditions);
    } else if (g.phase === PHASE.DRAFT) {
        await draft.untilUserOrEnd(conditions);
    } else if (g.phase === PHASE.AFTER_DRAFT) {
        await phase.newPhase(PHASE.RESIGN_PLAYERS, conditions);
    } else if (g.phase === PHASE.RESIGN_PLAYERS) {
        await phase.newPhase(PHASE.FREE_AGENCY, conditions);
    } else if (g.phase === PHASE.FREE_AGENCY) {
        await freeAgents.play(g.daysLeft, conditions);
    } else {
        throw new Error(`Unknown phase: ${g.phase}`);
    }
}

async function initAutoPlay(conditions: Conditions) {
    const result = await toUI(
        [
            "prompt",
            "This will play through multiple seasons, using the AI to manage your team. How many seasons do you want to simulate?",
            "5",
        ],
        conditions,
    );
    const numSeasons = parseInt(result, 10);

    if (Number.isInteger(numSeasons)) {
        local.autoPlaySeasons = numSeasons;
        autoPlay(conditions);
    }
}

// Flush cache, disconnect from league database, and unset g.lid
const close = async (disconnect?: boolean) => {
    const gameSim = lock.get("gameSim");

    local.autoPlaySeasons = 0;
    lock.set("stopGameSim", true);
    lock.set("gameSim", false);

    // Wait in case stuff is still happening (ugh)
    if (gameSim) {
        await new Promise(resolve => {
            setTimeout(() => {
                resolve();
            }, 1000);
        });
    }

    if (g.lid !== undefined && idb.league !== undefined) {
        await updateStatus("Saving...");
        await idb.cache.flush();
        await updateStatus("Idle");

        if (disconnect) {
            idb.cache.stopAutoFlush();

            // Should probably "close" cache here too, but no way to do that now

            idb.league.close();
        }
    }

    if (disconnect) {
        lock.reset();
        local.reset();

        g.lid = undefined;
    }
};

/**
 * Delete an existing league.
 *
 * @memberOf core.league
 * @param {number} lid League ID.
 * @param {function()=} cb Optional callback.
 */
async function remove(lid: number) {
    if (g.lid === lid) {
        close(true);
    }
    idb.meta.leagues.delete(lid);
    await backboard.delete(`league${lid}`);
}

export default {
    create,
    exportLeague,
    remove,
    setGameAttributes,
    updateMetaNameRegion,
    loadGameAttributes,
    autoPlay,
    initAutoPlay,
    close,
};
