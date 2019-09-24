// @flow

import { idb } from "../db";
import { g, getProcessedGames, helpers } from "../util";
import type { GetOutput, UpdateEvents } from "../../common/types";

export const setTeamInfo = (t, i, allStars, game) => {
    if (allStars) {
        const ind = t.tid === -1 ? 0 : 1;

        t.region = "Team";
        t.name = allStars.teamNames[ind].replace("Team ", "");
        t.abbrev = t.name.slice(0, 3).toUpperCase();
        if (i === 1 && t.abbrev === game.teams[0].abbrev) {
            t.abbrev = `${t.abbrev.slice(0, 2)}2`;
        }

        for (const p of t.players) {
            const entry = allStars.teams[ind].find(p2 => p2.pid === p.pid);
            p.abbrev = entry ? g.teamAbbrevsCache[entry.tid] : "";
        }
    } else {
        t.region = g.teamRegionsCache[t.tid];
        t.name = g.teamNamesCache[t.tid];
        t.abbrev = g.teamAbbrevsCache[t.tid];
    }
};

/**
 * Generate a box score.
 *
 * @memberOf views.gameLog
 * @param {number} gid Integer game ID for the box score (a negative number means no box score).
 * @return {Promise.Object} Resolves to an object containing the box score data (or a blank object).
 */
async function boxScore(gid: number) {
    if (gid < 0) {
        return {};
    }

    let game: any = helpers.deepCopy(await idb.cache.games.get(gid));

    // Only this season is in cache
    if (!game) {
        game = await idb.league.games.get(gid);
    }

    // If game doesn't exist (bad gid or deleted box scores), show nothing
    if (!game) {
        return {};
    }

    const allStarGame = game.teams[0].tid === -1 || game.teams[1].tid === -1;
    let allStars;
    if (allStarGame) {
        allStars = await idb.cache.allStars.get(game.season);
        if (!allStars) {
            return {};
        }
    }

    for (let i = 0; i < game.teams.length; i++) {
        const t = game.teams[i];

        setTeamInfo(t, i, allStars, game);

        // Floating point errors make this off a bit
        t.min = Math.round(t.min);

        // Put injured players at the bottom, then sort by GS and roster position
        t.players.sort((a, b) => {
            // This sorts by starters first and minutes second, since .min is always far less than 1000 and gs is either 1 or 0. Then injured players are listed at the end, if they didn't play.
            return (
                b.gs * 100000 +
                b.min * 1000 -
                b.injury.gamesRemaining -
                (a.gs * 100000 + a.min * 1000 - a.injury.gamesRemaining)
            );
        });
    }

    const wonInd = game.won.tid === game.teams[0].tid ? 0 : 1;
    const lostInd = wonInd === 0 ? 1 : 0;

    // WARNING - won/lost . region/name/abbrev is used to distinguish between GameLog and LiveGame in BoxScore, so be careful if you change this!
    game.won.region = game.teams[wonInd].region;
    game.won.name = game.teams[wonInd].name;
    game.won.abbrev = game.teams[wonInd].abbrev;
    game.lost.region = game.teams[lostInd].region;
    game.lost.name = game.teams[lostInd].name;
    game.lost.abbrev = game.teams[lostInd].abbrev;

    if (game.overtimes === 1) {
        game.overtime = " (OT)";
    } else if (game.overtimes > 1) {
        game.overtime = ` (${game.overtimes}OT)`;
    } else {
        game.overtime = "";
    }

    return game;
}

async function updateTeamSeason(
    inputs: GetOutput,
): void | { [key: string]: any } {
    return {
        // Needed for dropdown
        abbrev: inputs.abbrev,
        currentSeason: g.season,
        season: inputs.season,
    };
}

/**
 * Update the displayed box score, as necessary.
 *
 * If the box score is already loaded, nothing is done.
 *
 * @memberOf views.gameLog
 * @param {number} inputs.gid Integer game ID for the box score (a negative number means no box score).
 */
async function updateBoxScore(
    inputs: GetOutput,
    updateEvents: UpdateEvents,
    state: any,
): void | { [key: string]: any } {
    const { gid } = inputs;
    if (typeof gid !== "number") {
        return;
    }

    if (
        updateEvents.includes("firstRun") ||
        !state.boxScore ||
        gid !== state.boxScore.gid
    ) {
        const game = await boxScore(gid);

        const vars = {
            boxScore: game,
        };

        // Either update the box score if we found one, or show placeholder
        if (!game.hasOwnProperty("teams")) {
            vars.boxScore.gid = -1;
        } else {
            vars.boxScore.gid = gid;
        }

        return vars;
    }
}

/**
 * Update the game log list, as necessary.
 *
 * If the game log list is already loaded, nothing is done. If the game log list is loaded and a new game has been played, update. If the game log list is not loaded, load it.
 *
 * @memberOf views.gameLog
 * @param {string} inputs.abbrev Abbrev of the team for the list of games.
 * @param {number} inputs.season Season for the list of games.
 * @param {number} inputs.gid Integer game ID for the box score (a negative number means no box score), which is used only for highlighting the relevant entry in the list.
 */
async function updateGamesList(
    inputs: GetOutput,
    updateEvents: UpdateEvents,
    state: any,
): void | { [key: string]: any } {
    const { abbrev, season } = inputs;
    if (typeof abbrev !== "string" || typeof season !== "number") {
        return;
    }

    if (
        updateEvents.includes("firstRun") ||
        !state.gamesList ||
        abbrev !== state.gamesList.abbrev ||
        season !== state.gamesList.season ||
        (updateEvents.includes("gameSim") && season === g.season)
    ) {
        let games;
        if (
            state.gamesList &&
            (abbrev !== state.gamesList.abbrev ||
                season !== state.gamesList.season)
        ) {
            // Switching to a new list
            games = [];
        } else {
            games = state.gamesList ? state.gamesList.games : [];
        }

        const newGames = await getProcessedGames(abbrev, season, games);

        if (games.length === 0) {
            games = newGames;
        } else {
            for (let i = newGames.length - 1; i >= 0; i--) {
                games.unshift(newGames[i]);
            }
        }

        return {
            gamesList: {
                games,
                abbrev,
                season,
            },
        };
    }
}

export default {
    runBefore: [updateBoxScore, updateGamesList, updateTeamSeason],
};
