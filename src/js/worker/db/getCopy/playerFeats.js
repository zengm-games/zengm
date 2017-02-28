// @flow

import g from '../../../globals';
import {idb} from '../../db';
import {mergeByPk} from './helpers';

const getCopy = async (): Promise<any[]> => {
    return mergeByPk(
        await idb.league.playerFeats.getAll(),
        await g.cache.getAll('playerFeats'),
        g.cache.storeInfos.playerFeats.pk,
    );
};

export default getCopy;
