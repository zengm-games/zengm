// @flow

import { Cache, connectLeague, idb } from "../../db";
import { PHASE, PLAYER, g, helpers } from "../../../common";
import { draft, finances, player, team } from "../../core";
import setGameAttributes from "./setGameAttributes";
import {
    defaultGameAttributes,
    local,
    lock,
    random,
    toUI,
    updatePhase,
    updateStatus,
} from "../../util";
import type { Conditions, Player } from "../../../common/types";

// x and y are both arrays of objects with the same length. For each object, any properties in y but not x will be copied over to x.
const merge = (x: Object[], y: Object[]): Object[] => {
    for (let i = 0; i < x.length; i++) {
        // Fill in default values as needed
        for (const prop of Object.keys(y[i])) {
            if (!x[i].hasOwnProperty(prop)) {
                x[i][prop] = y[i][prop];
            }
        }
    }

    return x;
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
    randomizeRosters?: boolean = false,
    conditions: Conditions,
): Promise<number> => {
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
            teamSeasons[0].stadiumCapacity = teams[i].stadiumCapacity;
        }
        for (const teamSeason of teamSeasons) {
            teamSeason.tid = t.tid;
            if (typeof teamSeason.stadiumCapacity !== "number") {
                teamSeason.stadiumCapacity = 25000;
            }
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
            // Has to be any because I can't figure out how to change PlayerWithoutPidWithStats to Player
            const p: any = player.augmentPartialPlayer(
                p0,
                scoutingRank,
                leagueFile.version,
            );

            player.updateValues(p);
            await idb.cache.players.put(p);
        }
    } else {
        // Generate past 20 years of draft classes
        const NUM_PAST_SEASONS = 20;

        let newPlayers = [];
        for (let i = 0; i < NUM_PAST_SEASONS; i++) {
            const draftClass = draft.genPlayersWithoutSaving(
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
            player.updateValues(p);

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
            player.addStatsRow(p, g.phase === PHASE.PLAYOFFS);
            await idb.cache.players.add(p);

            // Weird Flow type casing is because idb.cache.players.add will create the "pid" property, transforming PlayerWithoutPid to Player
            await player.addRelatives(((p: any): Player));
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
    local.leagueLoaded = true;

    toUI(["bbgmPing", "league"], conditions);

    return lid;
};

export default create;
