// @flow

import g from '../../globals';
import {mergeByPk} from './helpers';

const getCopy = async (): Promise<any[]> => {
    return mergeByPk(
        await g.dbl.playerFeats.getAll(),
        await g.cache.getAll('playerFeats'),
        g.cache.storeInfos.playerFeats.pk,
    );
};

export default getCopy;
