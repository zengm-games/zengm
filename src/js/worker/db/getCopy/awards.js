import g from '../../../globals';
import {idb} from '../../db';
import {mergeByPk} from './helpers';
import type {Awards} from '../../../common/types';

const getCopy = async ({
    season,
}: {
    season?: number,
} = {}): Promise<Awards | Awards[]> => {
    if (season !== undefined) {
        const awards = mergeByPk(
            await idb.league.awards.getAll(season),
            (await g.cache.getAll('awards')).filter((event) => {
                return event.season === season;
            }),
            g.cache.storeInfos.awards.pk,
        );
        return awards[0];
    }

    return mergeByPk(
        await idb.league.awards.getAll(),
        await g.cache.getAll('awards'),
        g.cache.storeInfos.awards.pk,
    );
};

export default getCopy;
