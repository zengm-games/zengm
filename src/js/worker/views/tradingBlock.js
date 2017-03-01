import Promise from 'bluebird';
import {g, helpers} from '../../common';
import {trade} from '../core';
import {getCopy, idb} from '../db';
import type {GetOutput, UpdateEvents} from '../../common/types';

async function updateUserRoster(
    inputs: GetOutput,
    updateEvents: UpdateEvents,
): void | {[key: string]: any} {
    if (updateEvents.includes('firstRun') || updateEvents.includes('playerMovement') || updateEvents.includes('gameSim')) {
        let [userRoster, userPicks] = await Promise.all([
            idb.cache.indexGetAll('playersByTid', g.userTid),
            idb.cache.indexGetAll('draftPicksByTid', g.userTid),
        ]);

        userRoster = await getCopy.playersPlus(userRoster, {
            attrs: ["pid", "name", "age", "contract", "injury", "watch", "gamesUntilTradable"],
            ratings: ["ovr", "pot", "skills", "pos"],
            stats: ["min", "pts", "trb", "ast", "per"],
            season: g.season,
            tid: g.userTid,
            showNoStats: true,
            showRookies: true,
            fuzz: true,
        });
        userRoster = trade.filterUntradable(userRoster);

        for (let i = 0; i < userPicks.length; i++) {
            userPicks[i].desc = helpers.pickDesc(userPicks[i]);
        }

        return {
            gameOver: g.gameOver,
            phase: g.phase,
            userPicks,
            userRoster,
        };
    }
}

export default {
    runBefore: [updateUserRoster],
};
