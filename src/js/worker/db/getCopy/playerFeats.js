// @flow

import {idb} from '../../db';
import {mergeByPk} from './helpers';

const getCopy = async (): Promise<any[]> => {
    return mergeByPk(
        await idb.league.playerFeats.getAll(),
        await idb.cache.getAll('playerFeats'),
        idb.cache.storeInfos.playerFeats.pk,
    );
};

export default getCopy;
