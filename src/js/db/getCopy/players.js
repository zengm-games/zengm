import backboard from 'backboard';
import g from '../../globals';
import {mergeByPk} from './helpers';
import * as helpers from '../../util/helpers';
import type {Player} from '../../util/types';

const getCopy = async ({
    pid,
    retired,
    activeAndRetired,
    statsTid,
//    tid,
}: {
    pid?: number,
    retired?: boolean,
    activeAndRetired?: boolean,
    statsTid?: number,
//    tid?: [number, number] | number,
} = {}): Promise<(Player | Player[])> => {
    if (pid !== undefined) {
        const cachedPlayer = await g.cache.get('players', pid);
        if (cachedPlayer) {
            return helpers.deepCopy(cachedPlayer);
        }

        return g.dbl.players.get(pid);
    }

    if (retired === true) {
        return mergeByPk(
            await g.dbl.players.index('tid').getAll(g.PLAYER.RETIRED),
            await g.cache.indexGetAll('playersByTid', g.PLAYER.RETIRED),
            g.cache.storeInfos.players.pk,
        );
    }

/*    if (tid !== undefined) {
        if (Array.isArray(tid)) {
            const [minTid, maxTid] = tid;

            // Avoid g.PLAYER.RETIRED, since those aren't in cache
            if (minTid === g.PLAYER.RETIRED || maxTid === g.PLAYER.RETIRED || (minTid < g.PLAYER.RETIRED && maxTid > g.PLAYER.RETIRED)) {
                throw new Error('Not implemented');
            }
        }

        // This works if tid is a number or [min, max]
        return helpers.deepCopy(await g.cache.indexGetAll('playersByTid', tid));
    }*/


    if (activeAndRetired === true) {
        // All except draft prospects
        return mergeByPk(
            [].concat(
                await g.dbl.players.index('tid').getAll(g.PLAYER.RETIRED),
                await g.dbl.players.index('tid').getAll(backboard.lowerBound(g.PLAYER.FREE_AGENT)),
            ),
            [].concat(
                await g.cache.indexGetAll('playersByTid', g.PLAYER.RETIRED),
                await g.cache.indexGetAll('playersByTid', [g.PLAYER.FREE_AGENT, Infinity]),
            ),
            g.cache.storeInfos.players.pk,
        );
    }

    if (statsTid !== undefined) {
        return mergeByPk(
            await g.dbl.players.index('statsTids').getAll(statsTid),
            [].concat(
                await g.cache.indexGetAll('playersByTid', g.PLAYER.RETIRED),
                await g.cache.indexGetAll('playersByTid', [g.PLAYER.FREE_AGENT, Infinity]),
            ).filter((p) => p.statsTids.includes(statsTid)),
            g.cache.storeInfos.players.pk,
        );
    }

    return mergeByPk(
        await g.dbl.players.getAll(),
        await g.cache.getAll('players'),
        g.cache.storeInfos.players.pk,
    );
};

export default getCopy;
