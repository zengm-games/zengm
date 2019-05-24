// @flow

import { idb } from "../../../../deion/worker/db";
import { g } from "../../../../deion/worker/util";

/**
 * Given a list of players sorted by ability, find the starters.
 *
 *
 * @param  {[type]} players [description]
 * @param {Array.<string>} p Array positions of players on roster, sorted by value already.
 * @return {Array.<number>} Indexes of the starters from the input array. If this is of length < 5, then satisfactory starters couldn't be found and any players should be used to fill in the starting lineup.
 */
export const findStarters = (positions: string[]): number[] => {
    const starters = []; // Will be less than 5 in length if that's all it takes to meet requirements
    let numG = 0;
    let numFC = 0;
    let numC = 0;
    for (let i = 0; i < positions.length; i++) {
        if (starters.length === 5 || (numG >= 2 && numFC >= 2)) {
            break;
        }

        // Make sure we can get 2 G and 2 F/C
        if (
            5 - starters.length >
                (2 - numG > 0 ? 2 - numG : 0) +
                    (2 - numFC > 0 ? 2 - numFC : 0) ||
            (numG < 2 && positions[i].includes("G")) ||
            (numFC < 2 &&
                (positions[i].includes("F") ||
                    (positions[i] === "C" && numC === 0)))
        ) {
            starters.push(i);
            numG += positions[i].includes("G") ? 1 : 0;
            numFC += positions[i].includes("F") || positions[i] === "C" ? 1 : 0;
            numC += positions[i] === "C" ? 1 : 0;
        }
    }

    // Fill in after meeting requirements, but still not too many Cs!
    for (let i = 0; i < positions.length; i++) {
        if (starters.length === 5) {
            break;
        }
        if (starters.includes(i)) {
            continue;
        }
        if (numC >= 1 && positions[i] === "c") {
            continue;
        }

        starters.push(i);
        numC += positions[i] === "C" ? 1 : 0;
    }

    return starters;
};

/**
 * Sort a team's roster based on player ratings and stats.
 *
 * @memberOf core.team
 * @param {number} tid Team ID.
 * @return {Promise}
 */
const rosterAutoSort = async (tid: number, onlyNewPlayers?: boolean) => {
    if (onlyNewPlayers) {
        // This option is just for football currently
        return;
    }

    // Get roster and sort by value (no potential included)
    const playersFromCache = await idb.cache.players.indexGetAll(
        "playersByTid",
        tid,
    );
    let players = await idb.getCopies.playersPlus(playersFromCache, {
        attrs: ["pid", "valueNoPot", "valueNoPotFuzz"],
        ratings: ["pos"],
        season: g.season,
        showNoStats: true,
        showRookies: true,
    });
    // Fuzz only for user's team
    if (tid === g.userTid) {
        players.sort((a, b) => b.valueNoPotFuzz - a.valueNoPotFuzz);
    } else {
        players.sort((a, b) => b.valueNoPot - a.valueNoPot);
    }

    // Shuffle array so that position conditions are met - 2 G and 2 F/C in starting lineup, at most one pure C
    const positions = players.map(p => p.ratings.pos);
    const starters = findStarters(positions);
    const newPlayers = starters.map(i => players[i]);
    for (let i = 0; i < players.length; i++) {
        if (!starters.includes(i)) {
            newPlayers.push(players[i]);
        }
    }
    players = newPlayers;

    const rosterOrders = new Map();
    for (let i = 0; i < players.length; i++) {
        rosterOrders.set(players[i].pid, i);
    }

    // Update rosterOrder
    for (const p of playersFromCache) {
        const rosterOrder = rosterOrders.get(p.pid);

        // Only write to DB if this actually changes
        if (rosterOrder !== undefined && rosterOrder !== p.rosterOrder) {
            p.rosterOrder = rosterOrder;
            await idb.cache.players.put(p);
        }
    }
};

export default rosterAutoSort;
