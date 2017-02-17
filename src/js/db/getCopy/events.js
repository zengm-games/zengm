import g from '../../globals';
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
            await g.dbl.events.index('season').getAll(season),
            (await g.cache.getAll('events')).filter((event) => {
                return event.season === season;
            }),
            g.cache.storeInfos.events.pk,
        );
    }

    if (pid !== undefined) {
        return mergeByPk(
            await g.dbl.events.index('pids').getAll(pid),
            (await g.cache.getAll('events')).filter((event) => {
                return event.pids !== undefined && event.pids.includes(pid);
            }),
            g.cache.storeInfos.events.pk,
        );
    }

    return mergeByPk(
        await g.dbl.events.getAll(),
        await g.cache.getAll('events'),
        g.cache.storeInfos.events.pk,
    );
};

export default getCopy;
