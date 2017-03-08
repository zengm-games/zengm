// @flow

import {idb} from '../../db';
import {mergeByPk} from './helpers';

const getCopies = async (): Promise<any[]> => {
    return mergeByPk(
        await idb.league.playerFeats.getAll(),
        await idb.cache.playerFeats.getAll(),
        idb.cache.storeInfos.playerFeats.pk,
    );
};

export default getCopies;
