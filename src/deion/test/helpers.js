// @flow

import { Cache, idb } from "../worker/db";
import { STORES } from "../worker/db/Cache";
import { defaultGameAttributes, g, helpers } from "../worker/util";
import type { Store } from "../worker/db/Cache";

const mockIDBLeague = (): any => {
    const league = {};
    for (const store of STORES) {
        league[store] = {
            getAll() {
                return [];
            },
            index() {
                return {
                    getAll() {
                        return [];
                    },
                };
            },
        };
    }

    return league;
};

/**
 * Finds the number of times an element appears in an array.
 *
 * @memberOf test.core
 * @param {Array} array The array to search over.
 * @param {*} x Element to search for
 * @return {number} The number of times x was found in array.
 */
function numInArrayEqualTo<T>(array: T[], x: T): number {
    let n = 0;
    let idx = array.indexOf(x);
    while (idx !== -1) {
        n += 1;
        idx = array.indexOf(x, idx + 1);
    }
    return n;
}

const resetCache = async (data?: { [key: Store]: any[] }) => {
    idb.cache = new Cache();

    // We want these to do nothing while testing, usually
    // $FlowFixMe
    idb.cache.fill = async () => {};
    // $FlowFixMe
    idb.cache.flush = async () => {};

    for (const store of STORES) {
        // This stuff is all needed because a real Cache.fill is not called.
        idb.cache._data[store] = {};
        idb.cache._deletes[store] = new Set();
        idb.cache._dirtyRecords[store] = new Set();
        idb.cache._maxIds[store] = -1;
        idb.cache._markDirtyIndexes(store);
    }
    idb.cache._status = "full";

    if (!data) {
        return;
    }
    if (data.players) {
        for (const obj of data.players) {
            await idb.cache.players.add(obj);
        }
    }
    if (data.teams) {
        for (const obj of data.teams) {
            await idb.cache.teams.add(obj);
        }
    }
    if (data.teamSeasons) {
        for (const obj of data.teamSeasons) {
            await idb.cache.teamSeasons.add(obj);
        }
    }
    if (data.teamStats) {
        for (const obj of data.teamStats) {
            await idb.cache.teamStats.add(obj);
        }
    }
    if (data.trade) {
        for (const obj of data.trade) {
            await idb.cache.trade.add(obj);
        }
    }
};

const resetG = () => {
    const season = 2016;
    const teams = helpers.getTeamsDefault();

    Object.assign(g, defaultGameAttributes, {
        userTid: 0,
        userTids: [0],
        season,
        startingSeason: season,
        leagueName: "",
        teamAbbrevsCache: teams.map(t => t.abbrev),
        teamRegionsCache: teams.map(t => t.region),
        teamNamesCache: teams.map(t => t.name),
        gracePeriodEnd: season + 2,
        numTeams: teams.length,
    });
};

export default {
    mockIDBLeague,
    numInArrayEqualTo,
    resetCache,
    resetG,
};
