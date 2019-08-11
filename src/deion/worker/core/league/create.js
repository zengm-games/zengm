// @flow

import orderBy from "lodash/orderBy";
import range from "lodash/range";
import { Cache, connectLeague, idb } from "../../db";
import { DIFFICULTY, PHASE, PLAYER } from "../../../common";
import { draft, finances, freeAgents, league, player, team } from "..";
import {
    defaultGameAttributes,
    g,
    helpers,
    local,
    lock,
    overrides,
    random,
    toUI,
    updatePhase,
    updateStatus,
} from "../../util";
import type { Conditions, GameAttributes } from "../../../common/types";

const confirmSequential = (objs: any, key: string, objectName: string) => {
    const values = new Set();

    for (const obj of objs) {
        const value = obj[key];
        if (typeof value !== "number") {
            throw new Error(`Missing or invalid ${key} for ${objectName}`);
        }
        values.add(value);
    }

    for (let i = 0; i < values.size; i++) {
        if (!values.has(i)) {
            throw new Error(
                `${key} values must be sequential with no gaps starting from 0, but no ${objectName} has a value of ${i}`,
            );
        }
    }

    return values;
};

// Creates a league, writing nothing to the database.
export const createWithoutSaving = (
    leagueName: string,
    tid: number,
    leagueFile: Object,
    startingSeason: number,
    randomizeRosters: boolean,
    difficulty: number,
): {
    [key: string]: Object[],
    gameAttributes: GameAttributes,
} => {
    const teamsDefault = helpers.getTeamsDefault();

    // Any custom teams?
    let teamInfos: any;
    if (leagueFile.hasOwnProperty("teams")) {
        if (leagueFile.teams.length <= teamsDefault.length) {
            // This probably shouldn't be here, but oh well, backwards compatibility...
            teamInfos = leagueFile.teams.map((t, i) => {
                // Fill in default values as needed
                const t2 = teamsDefault[i];
                for (const prop of Object.keys(t2)) {
                    if (!t.hasOwnProperty(prop)) {
                        t[prop] = t2[prop];
                    }
                }

                return t;
            });
        } else {
            teamInfos = leagueFile.teams;
        }
        teamInfos = helpers.addPopRank(teamInfos);
    } else {
        teamInfos = teamsDefault;
    }

    // Handle random team
    let userTid = tid;
    if (userTid === -1 || userTid >= teamInfos.length) {
        userTid = random.randInt(0, teamInfos.length - 1);
    }

    const gameAttributes: GameAttributes = {
        ...defaultGameAttributes,
        userTid,
        userTids: [userTid],
        season: startingSeason,
        startingSeason,
        leagueName,
        teamAbbrevsCache: teamInfos.map(t => t.abbrev),
        teamRegionsCache: teamInfos.map(t => t.region),
        teamNamesCache: teamInfos.map(t => t.name),
        gracePeriodEnd: startingSeason + 2, // Can't get fired for the first two seasons
        numTeams: teamInfos.length, // Will be 30 if the user doesn't supply custom rosters
        difficulty,
    };

    if (leagueFile.hasOwnProperty("gameAttributes")) {
        for (let i = 0; i < leagueFile.gameAttributes.length; i++) {
            // Set default for anything except team ID and name, since they can be overwritten by form input.
            if (
                leagueFile.gameAttributes[i].key !== "userTid" &&
                leagueFile.gameAttributes[i].key !== "leagueName" &&
                leagueFile.gameAttributes[i].key !== "difficulty"
            ) {
                gameAttributes[leagueFile.gameAttributes[i].key] =
                    leagueFile.gameAttributes[i].value;
            }
        }

        // Special case for userTids - don't use saved value if userTid is not in it
        if (!gameAttributes.userTids.includes(gameAttributes.userTid)) {
            gameAttributes.userTids = [gameAttributes.userTid];
        }
    }

    // Extra check for easyDifficultyInPast, so that it won't be overwritten by a league file if the user selects Easy
    // when creating a new league.
    if (difficulty <= DIFFICULTY.Easy) {
        gameAttributes.easyDifficultyInPast = true;
    }

    // Ensure numGamesPlayoffSeries doesn't have an invalid value, relative to numTeams
    const oldNumGames = JSON.stringify(gameAttributes.numGamesPlayoffSeries);
    gameAttributes.numGamesPlayoffSeries = league.getValidNumGamesPlayoffSeries(
        gameAttributes.numGamesPlayoffSeries,
        gameAttributes.numPlayoffRounds,
        gameAttributes.numTeams,
    );
    delete gameAttributes.numPlayoffRounds;

    // If we're using some non-default value of numGamesPlayoffSeries, set byes to 0 otherwise it might break for football where the default number of byes is 4
    if (oldNumGames !== JSON.stringify(gameAttributes.numGamesPlayoffSeries)) {
        gameAttributes.numPlayoffByes = 0;
    }

    // Validation of some identifiers
    confirmSequential(teamInfos, "tid", "team");
    const cidsTeam = confirmSequential(teamInfos, "cid", "team");
    const didsTeam = confirmSequential(teamInfos, "did", "team");
    const cidsConfs = confirmSequential(
        gameAttributes.confs,
        "cid",
        "conference",
    );
    const didsDivs = confirmSequential(gameAttributes.divs, "did", "division");
    const cidsDivs = confirmSequential(gameAttributes.divs, "cid", "division");

    // It's okay to have an empty conference or division, but you can't reference a conference or division that doesn't exist!
    if (cidsConfs.size < cidsTeam.size) {
        throw new Error(
            `confs in game attributes only has ${cidsConfs.size} conferences, but your teams belong to ${cidsTeam.size} conferences`,
        );
    }
    if (cidsConfs.size < cidsDivs.size) {
        throw new Error(
            `confs in game attributes only has ${cidsConfs.size} conferences, but divs references ${cidsDivs.size} conferences`,
        );
    }
    if (didsDivs.size < didsTeam.size) {
        throw new Error(
            `divs in game attributes only has ${didsDivs.size} divisions, but your teams belong to ${didsTeam.size} divisions`,
        );
    }

    // Hacky - put gameAttributes in g so they can be seen by functions called from this function. Later will be properly done with setGameAttributes
    helpers.resetG();
    Object.assign(g, gameAttributes);

    // Needs to be done after g is set
    const teams = teamInfos.map(t => team.generate(t));

    // Draft picks for the first 4 years, as those are the ones can be traded initially
    let draftPicks: any;
    if (leagueFile.hasOwnProperty("draftPicks")) {
        draftPicks = leagueFile.draftPicks;
        for (const dp of leagueFile.draftPicks) {
            if (typeof dp.pick !== "number") {
                dp.pick = 0;
            }
        }
    } else {
        draftPicks = [];
        for (let i = 0; i < 4; i++) {
            for (let t = 0; t < teams.length; t++) {
                for (let round = 1; round <= g.numDraftRounds; round++) {
                    draftPicks.push({
                        tid: t,
                        originalTid: t,
                        round,
                        pick: 0,
                        season: startingSeason + i,
                    });
                }
            }
        }
    }

    // Import of legacy draftOrder data
    if (
        Array.isArray(leagueFile.draftOrder) &&
        leagueFile.draftOrder.length > 0 &&
        Array.isArray(leagueFile.draftOrder[0].draftOrder) &&
        (g.phase === PHASE.DRAFT_LOTTERY || g.phase === PHASE.DRAFT)
    ) {
        for (const dp of leagueFile.draftOrder[0].draftOrder) {
            if (g.phase === PHASE.FANTASY_DRAFT) {
                dp.season = "fantasy";
            } else {
                dp.season = g.season;
            }
            draftPicks.push(dp);
        }
    }

    const draftLotteryResults: any = leagueFile.hasOwnProperty(
        "draftLotteryResults",
    )
        ? leagueFile.draftLotteryResults
        : [];

    // teams already contains tid, cid, did, region, name, and abbrev. Let's add in the other keys we need for the league, and break out stuff for other object stores
    let scoutingRankTemp;
    const teamSeasons: any = [];
    const teamStats: any = [];
    for (let i = 0; i < teams.length; i++) {
        const t = teams[i];
        const teamInfo = teamInfos[i];

        let teamSeasonsLocal;
        if (teamInfo.hasOwnProperty("seasons")) {
            teamSeasonsLocal = teamInfo.seasons;
            const last = teamSeasonsLocal[teamSeasonsLocal.length - 1];
            if (last.season !== g.season) {
                last.season = g.season;
            }
        } else {
            teamSeasonsLocal = [team.genSeasonRow(t.tid)];
            teamSeasonsLocal[0].pop = teamInfo.pop;
            teamSeasonsLocal[0].stadiumCapacity = teamInfo.stadiumCapacity;
        }
        for (const teamSeason of teamSeasonsLocal) {
            teamSeason.tid = t.tid;
            if (typeof teamSeason.stadiumCapacity !== "number") {
                teamSeason.stadiumCapacity =
                    defaultGameAttributes.defaultStadiumCapacity;
            }

            // If this is specified in a league file, we can ignore it because they should all be in order, and sometimes people manually edit the file and include duplicates
            delete teamSeason.rid;

            teamSeasons.push(teamSeason);
        }

        let teamStatsLocal;
        if (teamInfo.hasOwnProperty("stats")) {
            teamStatsLocal = teamInfo.stats;
        } else {
            teamStatsLocal = [team.genStatsRow(t.tid)];
        }
        for (const ts of teamStatsLocal) {
            ts.tid = t.tid;

            if (ts.hasOwnProperty("ba")) {
                ts.oppBlk = ts.ba;
                delete ts.ba;
            }
            if (typeof ts.oppBlk !== "number" || Number.isNaN(ts.oppBlk)) {
                ts.oppBlk = 0;
            }

            teamStats.push(ts);
        }

        // Save scoutingRank for later
        if (i === userTid) {
            scoutingRankTemp = finances.getRankLastThree(
                teamSeasonsLocal,
                "expenses",
                "scouting",
            );
        }
    }
    const scoutingRank = scoutingRankTemp;
    if (scoutingRank === undefined) {
        throw new Error("scoutingRank should be defined");
    }

    let trade;
    if (
        leagueFile.hasOwnProperty("trade") &&
        Array.isArray(trade) &&
        trade.length === 1
    ) {
        trade = leagueFile.trade;
    } else {
        trade = [
            {
                rid: 0,
                teams: [
                    {
                        tid: userTid,
                        pids: [],
                        pidsExcluded: [],
                        dpids: [],
                        dpidsExcluded: [],
                    },
                    {
                        tid: userTid === 0 ? 1 : 0, // Load initial trade view with the lowest-numbered non-user team (so, either 0 or 1).
                        pids: [],
                        pidsExcluded: [],
                        dpids: [],
                        dpidsExcluded: [],
                    },
                ],
            },
        ];
    }

    const games = leagueFile.hasOwnProperty("games") ? leagueFile.games : [];
    for (const gm of games) {
        // Fix missing +/-, blocks against in boxscore
        if (!gm.teams[0].hasOwnProperty("ba")) {
            gm.teams[0].ba = 0;
            gm.teams[1].ba = 0;
        }
        for (const t of gm.teams) {
            for (const p of t.players) {
                if (!p.hasOwnProperty("ba")) {
                    p.ba = 0;
                }
                if (!p.hasOwnProperty("pm")) {
                    p.pm = 0;
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
    const leagueData: any = {};
    for (const store of toMaybeAdd) {
        leagueData[store] = leagueFile.hasOwnProperty(store)
            ? leagueFile[store]
            : [];
    }

    // Do this weird shit rather than genBaseMoods to avoid database access
    const teamSeasonsForBaseMoods = orderBy(
        teamSeasons.filter(ts => ts.season === gameAttributes.season),
        ["tid"],
    );
    const baseMoods = teamSeasonsForBaseMoods.map(ts =>
        player.genBaseMood(ts, false),
    );

    let players;
    if (leagueFile.hasOwnProperty("players")) {
        // Use pre-generated players, filling in attributes as needed
        if (randomizeRosters) {
            // Assign the team ID of all players to the 'playerTids' array.
            // Check tid to prevent draft prospects from being swapped with established players
            const playerTids = leagueFile.players
                .filter(p => p.tid > PLAYER.FREE_AGENT)
                .map(p => p.tid);

            // Shuffle the teams that players are assigned to.
            random.shuffle(playerTids);
            for (const p of leagueFile.players) {
                if (p.tid > PLAYER.FREE_AGENT) {
                    p.tid = playerTids.pop();
                    if (p.stats && p.stats.length > 0) {
                        p.stats[p.stats.length - 1].tid = p.tid;
                        p.statsTids.push(p.tid);
                    }
                }
            }
        }

        players = leagueFile.players.map(p0 => {
            // Has to be any because I can't figure out how to change PlayerWithoutPidWithStats to Player
            const p: any = player.augmentPartialPlayer(
                p0,
                scoutingRank,
                leagueFile.version,
            );

            if (p.tid >= g.numTeams) {
                p.tid = PLAYER.FREE_AGENT;
            }

            return p;
        });
    } else {
        players = [];

        // Generate past 20 years of draft classes
        const seasonOffset = g.phase >= PHASE.RESIGN_PLAYERS ? -1 : 0;
        const NUM_PAST_SEASONS = 20 + seasonOffset; // Keep synced with Dropdown.js seasonsAndOldDrafts and addRelatives
        const rookieSalaries = draft.getRookieSalaries();
        const keptPlayers = [];
        for (
            let numYearsAgo = NUM_PAST_SEASONS;
            numYearsAgo > seasonOffset;
            numYearsAgo--
        ) {
            let draftClass = draft.genPlayersWithoutSaving(
                g.season,
                scoutingRank,
            );

            // Very rough simulation of a draft
            draftClass = orderBy(draftClass, ["value"], ["desc"]);
            const tids = range(g.numTeams);
            random.shuffle(tids);

            for (let i = 0; i < draftClass.length; i++) {
                const p = draftClass[i];

                let round = 0;
                let pick = 0;
                const roundTemp = Math.floor(i / g.numTeams) + 1;
                if (roundTemp <= g.numDraftRounds) {
                    round = roundTemp;
                    pick = (i % g.numTeams) + 1;
                }

                // Save these for later, because player.develop will overwrite them
                const pot = p.ratings[0].pot;
                const ovr = p.ratings[0].ovr;
                const skills = p.ratings[0].skills;

                // Develop player and see if he is still non-retired
                player.develop(p, numYearsAgo, true);
                player.updateValues(p);
                // Run shouldRetire 4 times to simulate past shouldRetire calls
                if (
                    (!player.shouldRetire(p) &&
                        !player.shouldRetire(p) &&
                        !player.shouldRetire(p) &&
                        !player.shouldRetire(p)) ||
                    numYearsAgo <= 3
                ) {
                    // Do this before developing, to save ratings
                    p.draft = {
                        round,
                        pick,
                        tid: round === 0 ? -1 : tids[pick - 1],
                        year: g.season - numYearsAgo,
                        originalTid: round === 0 ? -1 : tids[pick - 1],
                        pot,
                        ovr,
                        skills,
                    };

                    if (round === 0) {
                        // Guarantee contracts for undrafted players are overwritten below
                        p.contract.exp = -Infinity;
                    } else {
                        const years = 4 - round; // 2 years for 2nd round, 3 years for 1st round;
                        player.setContract(
                            p,
                            {
                                amount: rookieSalaries[i],
                                exp: g.season - numYearsAgo + years,
                            },
                            false,
                        );
                    }

                    keptPlayers.push(p);
                }
            }
        }

        // (g.maxRosterSize + 1) for wiggle room (need min contract FAs sometimes)
        if (keptPlayers.length < (g.maxRosterSize + 1) * g.numTeams) {
            throw new Error("Not enough players!");
        }

        const numPlayerPerTeam = g.maxRosterSize - 2; // 13 for basketball
        const maxNumFreeAgents = Math.round((g.numTeams / 3) * g.maxRosterSize); // 150 for basketball

        // Add players to teams or free agency
        keptPlayers.sort((a, b) => b.value - a.value);

        // Keep track of number of players on each team
        const numPlayersByTid = {};
        for (const tid2 of range(g.numTeams)) {
            numPlayersByTid[tid2] = 0;
        }

        const addPlayerToTeam = (p, tid2: number) => {
            numPlayersByTid[tid2] += 1;

            p.tid = tid2;
            player.addStatsRow(p, g.phase === PHASE.PLAYOFFS);

            // Keep rookie contract, or no?
            if (p.contract.exp >= g.season) {
                player.setContract(p, p.contract, true);
            } else {
                player.setContract(p, player.genContract(p, true), true);
            }

            players.push(p);
        };

        const probStillOnDraftTeam = p => {
            let prob = 0; // Probability a player is still on his draft team
            const numYearsAgo = g.season - p.draft.year;
            if (typeof p.draft.round === "number") {
                if (numYearsAgo < 8) {
                    prob = (8 - numYearsAgo) / 8; // 87.5% for last year, 75% for 2 years ago, etc
                } else {
                    prob = 0.125;
                }
                if (p.draft.round > 1) {
                    prob *= 0.75;
                }
                if (p.draft.round > 3) {
                    prob *= 0.75;
                }
                if (p.draft.round > 5) {
                    prob *= 0.75;
                }
                if (p.draft.round > 7) {
                    prob *= 0.75;
                }
            }

            return prob;
        };

        // Drafted players kept with own team, with some probability
        for (let i = 0; i < numPlayerPerTeam * g.numTeams; i++) {
            const p = keptPlayers[i];
            if (
                p.draft.tid >= 0 &&
                Math.random() < probStillOnDraftTeam(p) &&
                numPlayersByTid[p.draft.tid] < numPlayerPerTeam
            ) {
                addPlayerToTeam(p, p.draft.tid);
                keptPlayers.splice(i, 1);
            }
        }

        // Then add other players, up to the limit
        while (true) {
            // Random order tids, so no team is a superpower
            const tids = range(g.numTeams);
            random.shuffle(tids);

            let numTeamsDone = 0;
            for (const currentTid of tids) {
                if (numPlayersByTid[currentTid] >= numPlayerPerTeam) {
                    numTeamsDone += 1;
                    continue;
                }

                const p = freeAgents.getBest(
                    players.filter(p2 => p2.tid === currentTid),
                    keptPlayers,
                );

                if (p) {
                    addPlayerToTeam(p, currentTid);
                } else {
                    console.log(currentTid, "can't find player");
                    numTeamsDone += 1;
                }
            }

            if (numTeamsDone === g.numTeams) {
                break;
            }
        }

        // Adjustment for hard cap - lower contracts for teams above cap
        if (g.hardCap) {
            for (const tid2 of range(g.numTeams)) {
                const roster = players.filter(p => p.tid === tid2);
                let payroll = roster.reduce(
                    (total, p) => total + p.contract.amount,
                    0,
                );
                while (payroll > g.salaryCap) {
                    let foundAny = false;
                    for (const p of roster) {
                        if (p.contract.amount >= g.minContract + 50) {
                            p.contract.amount -= 50;
                            payroll -= 50;
                            foundAny = true;
                        }
                    }

                    if (!foundAny) {
                        throw new Error(
                            "Invalid combination of hardCap, salaryCap, and minContract",
                        );
                    }
                }
            }
        }

        // Finally, free agents
        for (let i = 0; i < maxNumFreeAgents; i++) {
            const p = keptPlayers[i];
            if (p) {
                p.yearsFreeAgent = Math.random() > 0.5 ? 1 : 0; // So half will be eligible to retire after the first season
                player.setContract(p, player.genContract(p, false), false);
                player.addToFreeAgents(p, g.phase, baseMoods);
                players.push(p);
            }
        }
    }

    // See if imported roster has draft picks included. If so, create less than 70 (scaled for number of teams)
    const baseNumPlayers = Math.round((g.numDraftRounds * g.numTeams * 7) / 6); // 70 for basketball 2 round draft
    let createUndrafted1 = baseNumPlayers;
    let createUndrafted2 = baseNumPlayers;
    let createUndrafted3 = baseNumPlayers;
    const seasonOffset = g.phase >= PHASE.RESIGN_PLAYERS ? 1 : 0;
    for (const p of players) {
        if (p.tid === PLAYER.UNDRAFTED) {
            if (p.draft.year === g.season + seasonOffset) {
                createUndrafted1 -= 1;
            } else if (p.draft.year === g.season + seasonOffset + 1) {
                createUndrafted2 -= 1;
            } else if (p.draft.year === g.season + seasonOffset + 2) {
                createUndrafted3 -= 1;
            }
        }
    }
    // If the draft has already happened this season but next year's class hasn't been bumped up, don't create any PLAYER.UNDRAFTED
    if (
        createUndrafted1 > 0 &&
        (g.phase <= PHASE.DRAFT_LOTTERY || g.phase >= PHASE.RESIGN_PLAYERS)
    ) {
        const draftClass = draft.genPlayersWithoutSaving(
            g.season + seasonOffset,
            scoutingRank,
            createUndrafted1,
        );
        players = players.concat(draftClass);
    }
    if (createUndrafted2 > 0) {
        const draftClass = draft.genPlayersWithoutSaving(
            g.season + 1 + seasonOffset,
            scoutingRank,
            createUndrafted2,
        );
        players = players.concat(draftClass);
    }
    if (createUndrafted3 > 0) {
        const draftClass = draft.genPlayersWithoutSaving(
            g.season + 2 + seasonOffset,
            scoutingRank,
            createUndrafted3,
        );
        players = players.concat(draftClass);
    }

    return Object.assign(leagueData, {
        draftLotteryResults,
        draftPicks,
        gameAttributes,
        players,
        teamSeasons,
        teamStats,
        teams,
        trade,
    });
};

/**
 * Create a new league.
 *
 * @memberOf core.league
 * @param {string} name The name of the league.
 * @param {number} tid The team ID for the team the user wants to manage (or -1 for random).
 */
const create = async (
    name: string,
    tid: number,
    leagueFile: Object = {},
    startingSeason: number,
    randomizeRosters: boolean = false,
    difficulty: number,
    conditions: Conditions,
): Promise<number> => {
    await idb.meta.attributes.put(tid, "lastSelectedTid");

    const leagueData = createWithoutSaving(
        name,
        tid,
        leagueFile,
        startingSeason,
        randomizeRosters,
        difficulty,
    );

    let phaseText;
    if (
        leagueFile.hasOwnProperty("meta") &&
        leagueFile.meta.hasOwnProperty("phaseText")
    ) {
        phaseText = leagueFile.meta.phaseText;
    } else {
        phaseText = "";
    }

    const userTid = leagueData.gameAttributes.userTid;

    const lid = await idb.meta.leagues.add({
        name,
        tid: userTid,
        phaseText,
        teamName: leagueData.teams[userTid].name,
        teamRegion: leagueData.teams[userTid].region,
        heartbeatID: undefined,
        heartbeatTimestamp: undefined,
        difficulty,
    });
    idb.league = await connectLeague(lid);

    // These wouldn't be needed here, except the beforeView logic is fucked up
    lock.reset();
    local.reset();

    // Clear old game attributes from g, to make sure the new ones are saved to the db in setGameAttributes
    helpers.resetG();
    g.lid = lid;
    await toUI(["resetLeague"]);

    if (idb.cache) {
        idb.cache.stopAutoFlush();
    }
    idb.cache = new Cache();
    idb.cache.newLeague = true;
    await idb.cache.fill(leagueData.gameAttributes.season);

    // Handle gameAttributes special, to get extra functionality from setGameAttributes and because it's not in
    // the database native format in leagueData (object, not array like others).
    await league.setGameAttributes(leagueData.gameAttributes);

    for (const [store, records] of Object.entries(leagueData)) {
        if (store === "gameAttributes" || !Array.isArray(records)) {
            continue;
        }

        for (const record of records) {
            // $FlowFixMe
            await idb.cache[store].put(record);
        }
    }

    // If no players were uploaded in custom league file, add some relatives!
    if (leagueFile.players === undefined) {
        const players = await idb.cache.players.getAll();
        for (const p of players) {
            await player.addRelatives(p);
        }
    }

    const skipNewPhase = leagueFile.hasOwnProperty("gameAttributes")
        ? leagueFile.gameAttributes.some(ga => ga.key === "phase")
        : false;
    if (!skipNewPhase) {
        await updatePhase();
        await updateStatus("Idle");

        // Auto sort rosters
        await Promise.all(
            leagueData.teams.map(t => {
                if (!overrides.core.team.rosterAutoSort) {
                    throw new Error(
                        "Missing overrides.core.team.rosterAutoSort",
                    );
                }
                return overrides.core.team.rosterAutoSort(t.tid);
            }),
        );
    }

    await idb.cache.flush();
    idb.cache.startAutoFlush();
    local.leagueLoaded = true;

    toUI(["bbgmPing", "league", lid], conditions);

    return lid;
};

export default create;
