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
            (await idb.cache.getAll('awards')).filter((event) => {
                return event.season === season;
            }),
            idb.cache.storeInfos.awards.pk,
        );
        return awards[0];
    }

    return mergeByPk(
        await idb.league.awards.getAll(),
        await idb.cache.getAll('awards'),
        idb.cache.storeInfos.awards.pk,
    );
};

export default getCopy;
