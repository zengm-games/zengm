// @flow

import { Cache, connectLeague, idb } from "../db";
import { g } from "../../common";
import { league } from "../core";
import {
    env,
    helpers,
    local,
    toUI,
    updatePhase,
    updatePlayMenu,
    updateStatus,
} from "../util";
import type { Conditions, League } from "../../common/types";

let heartbeatIntervalID: IntervalID;

// Heartbeat stuff would be better inside a single transaction, but Firefox doesn't like that.

const getLeague = async (lid: number): Promise<League> => {
    // Make sure this league exists before proceeding
    const l = await idb.meta.leagues.get(lid);
    if (l === undefined) {
        throw new Error("League not found.");
    }
    return l;
};

const runHeartbeat = async (l: League) => {
    l.heartbeatID = env.heartbeatID;
    l.heartbeatTimestamp = Date.now();
    await idb.meta.leagues.put(l);
};

const startHeartbeat = async (l: League) => {
    // First one within this transaction
    await runHeartbeat(l);

    // Then in new transaction
    const lid = l.lid;
    setTimeout(() => {
        clearInterval(heartbeatIntervalID); // Shouldn't be necessary, but just in case
        heartbeatIntervalID = setInterval(async () => {
            const l2 = await getLeague(lid);
            await runHeartbeat(l2);
        }, 1000);
    }, 1000);
};

// Check if loaded in another tab
const checkHeartbeat = async (lid: number) => {
    const l = await getLeague(lid);
    const { heartbeatID, heartbeatTimestamp } = l;

    if (heartbeatID === undefined || heartbeatTimestamp === undefined) {
        await startHeartbeat(l);
        return;
    }

    // If this is the same active tab (like on ctrl+R), no problem
    if (env.heartbeatID === heartbeatID) {
        await startHeartbeat(l);
        return;
    }

    // Difference between now and stored heartbeat in milliseconds
    const diff = Date.now() - heartbeatTimestamp;

    // If diff is greater than 10 seconds, assume other tab was closed
    if (diff > 5 * 1000) {
        await startHeartbeat(l);
        return;
    }

    throw new Error(
        "A league can only be open in one tab at a time. If this league is not open in another tab, please wait a few seconds and reload. Or switch to Chrome or Firefox, they don't have this limitation.",
    );
};

// beforeLeague runs when the user switches leagues (including the initial league selection).
let loadingNewLid;
const beforeLeague = async (
    newLid: number,
    loadedLid: number | void,
    conditions: Conditions,
) => {
    // Make sure league template FOR THE CURRENT LEAGUE is showing
    loadingNewLid = newLid;

    const switchingDatabaseLid = newLid !== g.lid;
    if (switchingDatabaseLid) {
        await league.close(true);
    }
    if (loadingNewLid !== newLid) {
        return;
    } // Check after every async action

    // If this is a Web Worker, only one tab of a league can be open at a time
    if (!env.useSharedWorker) {
        clearInterval(heartbeatIntervalID);
        await checkHeartbeat(newLid);
    }
    if (loadingNewLid !== newLid) {
        return;
    }

    if (switchingDatabaseLid) {
        // Clear old game attributes from g, just to be sure
        helpers.resetG();
        await toUI(["resetG"]);
        if (loadingNewLid !== newLid) {
            return;
        }

        // Confirm league exists before proceeding
        await getLeague(newLid);

        g.lid = newLid;
        idb.league = await connectLeague(g.lid);
        if (loadingNewLid !== newLid) {
            return;
        }

        // Reuse existing cache, if it was just created while generating a new league
        if (!idb.cache || !idb.cache.newLeague || switchingDatabaseLid) {
            if (idb.cache) {
                idb.cache.stopAutoFlush();
            }
            idb.cache = new Cache();
            await idb.cache.fill();
            idb.cache.startAutoFlush();

            if (loadingNewLid !== newLid) {
                return;
            }
        } else if (idb.cache && idb.cache.newLeague) {
            idb.cache.newLeague = false;
        }
    }

    await league.loadGameAttributes();
    if (loadingNewLid !== newLid) {
        return;
    }
    local.leagueLoaded = true;

    // Update play menu
    await updateStatus(undefined);
    if (loadingNewLid !== newLid) {
        return;
    }
    await updatePhase(conditions);
    if (loadingNewLid !== newLid) {
        return;
    }
    await updatePlayMenu();
    if (loadingNewLid !== newLid) {
        return;
    }

    // If this is a Shared Worker, only one league can be open at a time
    if (env.useSharedWorker) {
        await toUI(["newLid", g.lid]);
    }
};

// beforeNonLeague runs when the user clicks a link back to the dashboard while in a league. beforeNonLeagueRunning is to handle extra realtimeUpdate request triggered by stopping gameSim in league.disconnect
let beforeNonLeagueRunning = false;
const beforeNonLeague = async (conditions: Conditions) => {
    if (!beforeNonLeagueRunning) {
        try {
            beforeNonLeagueRunning = true;
            await league.close(false);
            await toUI(["resetG"], conditions);
            if (!env.useSharedWorker) {
                clearInterval(heartbeatIntervalID);
            }
            beforeNonLeagueRunning = false;
        } catch (err) {
            beforeNonLeagueRunning = false;
            throw err;
        }
    }
};

export default {
    league: beforeLeague,
    nonLeague: beforeNonLeague,
};
