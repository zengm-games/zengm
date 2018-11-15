// @flow

import { idb } from "../db";
import { g, getProcessedGames, helpers } from "../util";
import type { GetOutput, UpdateEvents } from "../../common/types";

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

    for (let i = 0; i < game.teams.length; i++) {
        const t = game.teams[i];

        t.abbrev = g.teamAbbrevsCache[t.tid];
        t.region = g.teamRegionsCache[t.tid];
        t.name = g.teamNamesCache[t.tid];

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

    // WARNING - this stuff is used to distinguish between GameLog and LiveGame in BoxScore, so be careful if you change it
    game.won.region = g.teamRegionsCache[game.won.tid];
    game.won.name = g.teamNamesCache[game.won.tid];
    game.won.abbrev = g.teamAbbrevsCache[game.won.tid];
    game.lost.region = g.teamRegionsCache[game.lost.tid];
    game.lost.name = g.teamNamesCache[game.lost.tid];
    game.lost.abbrev = g.teamAbbrevsCache[game.lost.tid];

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
