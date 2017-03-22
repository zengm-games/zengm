// @flow

import backboard from 'backboard';
import {PLAYER, helpers} from '../../../common';
import {idb} from '../../db';
import {mergeByPk} from './helpers';
import type {Player} from '../../../common/types';

const getCopies = async ({
    pid,
    retired,
    activeAndRetired,
    activeSeason,
    draftYear,
    statsTid,
    tid,
}: {
    pid?: number,
    retired?: boolean,
    activeAndRetired?: boolean,
    activeSeason?: number,
    draftYear?: number,
    statsTid?: number,
    tid?: [number, number] | number,
} = {}): Promise<Player[]> => {
    if (pid !== undefined) {
        const cachedPlayer = await idb.cache.players.get(pid);
        if (cachedPlayer) {
            return [helpers.deepCopy(cachedPlayer)];
        }

        return [idb.league.players.get(pid)];
    }

    if (retired === true) {
        return mergeByPk(
            await idb.league.players.index('tid').getAll(PLAYER.RETIRED),
            await idb.cache.players.indexGetAll('playersByTid', PLAYER.RETIRED),
            idb.cache.storeInfos.players.pk,
        );
    }

    if (tid !== undefined) {
        if (Array.isArray(tid)) {
            const [minTid, maxTid] = tid;

            // Avoid PLAYER.RETIRED, since those aren't in cache
            if (minTid === PLAYER.RETIRED || maxTid === PLAYER.RETIRED || (minTid < PLAYER.RETIRED && maxTid > PLAYER.RETIRED)) {
                throw new Error('Not implemented');
            }
        }

        // This works if tid is a number or [min, max]
        return helpers.deepCopy(await idb.cache.players.indexGetAll('playersByTid', tid));
    }


    if (activeAndRetired === true) {
        // All except draft prospects
        return mergeByPk(
            [].concat(
                await idb.league.players.index('tid').getAll(PLAYER.RETIRED),
                await idb.league.players.index('tid').getAll(backboard.lowerBound(PLAYER.FREE_AGENT)),
            ),
            [].concat(
                await idb.cache.players.indexGetAll('playersByTid', PLAYER.RETIRED),
                await idb.cache.players.indexGetAll('playersByTid', [PLAYER.FREE_AGENT, Infinity]),
            ),
            idb.cache.storeInfos.players.pk,
        );
    }

    if (activeSeason !== undefined) {
        const fromDB = await new Promise((resolve, reject) => {
            idb.league.tx('players', (tx) => {
                const players = [];

                const index = tx.players.index('draft.year, retiredYear')._rawIndex;

                // + 1 in upper range is because you don't accumulate stats until the year after the draft
                const range = backboard.bound([0, activeSeason], [activeSeason + 1, Infinity]);

                const request = index.openCursor(range);
                request.onerror = (e) => {
                    reject(e.target.error);
                };
                request.onsuccess = (e) => {
                    const cursor = e.target.result;
                    if (!cursor) {
                        resolve(players);
                        return;
                    }

                    const [draftYear2, retiredYear] = cursor.key;

                    // https://gist.github.com/inexorabletash/704e9688f99ac12dd336
                    if (retiredYear < activeSeason) {
                        cursor.continue([draftYear2, activeSeason]);
                    } else {
                        players.push(cursor.value);
                        cursor.continue();
                    }
                };
            });
        });

        return mergeByPk(
            fromDB,
            [].concat(
                await idb.cache.players.indexGetAll('playersByTid', PLAYER.RETIRED),
                await idb.cache.players.indexGetAll('playersByTid', [PLAYER.FREE_AGENT, Infinity]),
            ).filter((p) => p.draft.year < activeSeason && p.retiredYear >= activeSeason),
            idb.cache.storeInfos.players.pk,
        );
    }

    if (draftYear !== undefined) {
        return mergeByPk(
            await idb.league.players.index('draft.year, retiredYear').getAll(backboard.bound([draftYear, 0], [draftYear, Infinity])),
            [].concat(
                await idb.cache.players.indexGetAll('playersByTid', PLAYER.RETIRED),
                await idb.cache.players.indexGetAll('playersByTid', [PLAYER.FREE_AGENT, Infinity]),
            ).filter((p) => p.draft.year === draftYear),
            idb.cache.storeInfos.players.pk,
        );
    }

    const constStatsTid = statsTid;
    if (constStatsTid !== undefined) {
        return mergeByPk(
            await idb.league.players.index('statsTids').getAll(constStatsTid),
            [].concat(
                await idb.cache.players.indexGetAll('playersByTid', PLAYER.RETIRED),
                await idb.cache.players.indexGetAll('playersByTid', [PLAYER.FREE_AGENT, Infinity]),
            ).filter((p) => p.statsTids.includes(constStatsTid)),
            idb.cache.storeInfos.players.pk,
        );
    }

    return mergeByPk(
        await idb.league.players.getAll(),
        await idb.cache.players.getAll(),
        idb.cache.storeInfos.players.pk,
    );
};

export default getCopies;
