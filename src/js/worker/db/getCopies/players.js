import backboard from 'backboard';
import {PLAYER, helpers} from '../../../common';
import {idb} from '../../db';
import {mergeByPk} from './helpers';
import type {Player} from '../../../common/types';

const getCopies = async ({
    pid,
    retired,
    activeAndRetired,
    statsTid,
    tid,
}: {
    pid?: number,
    retired?: boolean,
    activeAndRetired?: boolean,
    statsTid?: number,
    tid?: [number, number] | number,
} = {}): Promise<(Player | Player[])> => {
    if (pid !== undefined) {
        const cachedPlayer = await idb.cache.players.get(pid);
        if (cachedPlayer) {
            return helpers.deepCopy(cachedPlayer);
        }

        return idb.league.players.get(pid);
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

    if (statsTid !== undefined) {
        return mergeByPk(
            await idb.league.players.index('statsTids').getAll(statsTid),
            [].concat(
                await idb.cache.players.indexGetAll('playersByTid', PLAYER.RETIRED),
                await idb.cache.players.indexGetAll('playersByTid', [PLAYER.FREE_AGENT, Infinity]),
            ).filter((p) => p.statsTids.includes(statsTid)),
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
