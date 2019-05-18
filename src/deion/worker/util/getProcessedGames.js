// @flow

import { idb } from "../db";
import g from "./g";
import type { GameProcessed } from "../../common/types";

/**
 * Generate a game log list.
 *
 * @memberOf helpers
 * @param {string} abbrev Abbrev of the team for the list of games.
 * @param {number} season Season for the list of games.
 * @param {number} gid Integer game ID for the box score (a negative number means no box score), which is used only for highlighting the relevant entry in the list.
 * @param {Array.<Object>} gid Array of already-loaded games. If this is not empty, then only new games that are not already in this array will be passed to the callback.
 * @return {Promise.<Array.<Object>>} Resolves to a list of game objects.
 */
async function getProcessedGameList(
    abbrev: string,
    season: number,
    loadedGames: GameProcessed[] = [],
): Promise<GameProcessed[]> {
    const tid = g.teamAbbrevsCache.indexOf(abbrev);
    if (tid < 0) {
        throw new Error(`Invalid abbrev: "${abbrev}"`);
    }

    let maxGid;
    if (loadedGames.length > 0) {
        maxGid = loadedGames[0].gid; // Load new games
    } else {
        maxGid = -1; // Load all games
    }

    const gameInfos = [];

    let games;
    if (season === g.season) {
        // $FlowFixMe
        games = await idb.cache.games.getAll();
    } else {
        games = await idb.league.games.index("season").getAll(season);
    }

    // Iterate backwards, was more useful back when current season wasn't cached
    for (let i = games.length - 1; i >= 0; i--) {
        const gm = games[i];

        if (gm.gid <= maxGid) {
            break;
        }

        let overtime;
        if (gm.overtimes === 1) {
            overtime = " (OT)";
        } else if (gm.overtimes > 1) {
            overtime = ` (${gm.overtimes}OT)`;
        } else {
            overtime = "";
        }

        // Check tid
        if (gm.teams[0].tid === tid || gm.teams[1].tid === tid) {
            if (gm.teams[0].tid === tid) {
                gameInfos.push({
                    gid: gm.gid,
                    overtime,
                    tid,
                    home: true,
                    oppAbbrev: g.teamAbbrevsCache[gm.teams[1].tid],
                    oppPts: gm.teams[1].pts,
                    oppTid: gm.teams[1].tid,
                    pts: gm.teams[0].pts,
                    result:
                        gm.teams[0].pts > gm.teams[1].pts
                            ? "W"
                            : gm.teams[0].pts < gm.teams[1].pts
                            ? "L"
                            : "T",
                });
            } else if (gm.teams[1].tid === tid) {
                gameInfos.push({
                    gid: gm.gid,
                    overtime,
                    tid,
                    home: false,
                    oppAbbrev: g.teamAbbrevsCache[gm.teams[0].tid],
                    oppPts: gm.teams[0].pts,
                    oppTid: gm.teams[0].tid,
                    pts: gm.teams[1].pts,
                    result:
                        gm.teams[1].pts > gm.teams[0].pts
                            ? "W"
                            : gm.teams[1].pts < gm.teams[0].pts
                            ? "L"
                            : "T",
                });
            }
        }
    }

    return gameInfos;
}

export default getProcessedGameList;
