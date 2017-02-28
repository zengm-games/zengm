import {idb} from '../../db';
import {mergeByPk} from './helpers';

const getCopy = async ({
    pid,
    season,
}: {
    pid?: number,
    season?: number,
} = {}): Promise<any[]> => {
    if (season !== undefined && pid !== undefined) {
        throw new Error("Can't currently filter by season and pid");
    }

    if (season !== undefined) {
        return mergeByPk(
            await idb.league.events.index('season').getAll(season),
            (await idb.cache.getAll('events')).filter((event) => {
                return event.season === season;
            }),
            idb.cache.storeInfos.events.pk,
        );
    }

    if (pid !== undefined) {
        return mergeByPk(
            await idb.league.events.index('pids').getAll(pid),
            (await idb.cache.getAll('events')).filter((event) => {
                return event.pids !== undefined && event.pids.includes(pid);
            }),
            idb.cache.storeInfos.events.pk,
        );
    }

    return mergeByPk(
        await idb.league.events.getAll(),
        await idb.cache.getAll('events'),
        idb.cache.storeInfos.events.pk,
    );
};

export default getCopy;
