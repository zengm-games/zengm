// @flow

import {Cache, connectLeague, idb} from '../db';
import {g, helpers} from '../../common';
import {league} from '../core';
import {env, toUI, updatePhase, updatePlayMenu, updateStatus} from '../util';
import type {Conditions, League} from '../../common/types';

let heartbeatIntervalID: number | void;

// Heartbeat stuff would be better inside a single transaction, but Firefox doesn't like that.

const getLeague = async (lid: number): Promise<League> => {
    // Make sure this league exists before proceeding
    const l = await idb.meta.leagues.get(lid);
    if (l === undefined) {
        throw new Error('League not found.');
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
    const {heartbeatID, heartbeatTimestamp} = l;

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

    throw new Error('A league can only be open in one tab at a time. If this league is not open in another tab, please wait a few seconds and reload.');
};

const beforeLeague = async (newLid: number, loadedLid: ?number, conditions: Conditions) => {
    // Make sure league template FOR THE CURRENT LEAGUE is showing
    if (newLid !== loadedLid) {
        if (newLid !== g.lid) {
            await league.disconnect();
        }

        // If this is a Web Worker, only one tab of a league can be open at a time
        if (!env.useSharedWorker) {
            clearInterval(heartbeatIntervalID);
            await checkHeartbeat(newLid);
        }

        if (newLid !== g.lid) {
            // Clear old game attributes from g, just to be sure
            helpers.resetG();
            await toUI(['resetG'], conditions);

            g.lid = newLid;
            idb.league = await connectLeague(g.lid);

            // Reuse existing cache, if it was just created for a new league
            if (!idb.cache || !idb.cache.newLeague) {
                idb.cache = new Cache();
                await idb.cache.fill();
            } else if (idb.cache && idb.cache.newLeague) {
                idb.cache.newLeague = false;
            }
        }

        await league.loadGameAttributes();

        // Update play menu
        await updateStatus(undefined, conditions);
        await updatePhase(conditions);
        await updatePlayMenu();

        if (newLid !== g.lid) {
            // This is the only place we need to do this, since every league connection passes through here
            await idb.cache.startAutoFlush();
        }

        toUI(['emit', 'updateTopMenu', {lid: g.lid}], conditions);
    }
};

// beforeNonLeagueRunning is to handle extra realtimeUpdate request triggered by stopping gameSim in league.disconnect
let beforeNonLeagueRunning = false;
const beforeNonLeague = async (conditions: Conditions) => {
    if (!beforeNonLeagueRunning) {
        try {
            beforeNonLeagueRunning = true;
//            await league.disconnect(); // Breaks multi tab mode unless we track open tabs
            clearInterval(heartbeatIntervalID);
            await toUI(['emit', 'updateTopMenu', {lid: undefined}], conditions);
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
