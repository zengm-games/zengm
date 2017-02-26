// @flow

import backboard from 'backboard';
import g from '../../../globals';
import {mergeByPk} from './helpers';
import type {PlayerStats} from '../../../common/types';

const getCopy = async ({pid}: {pid: number}): Promise<PlayerStats[]> => {
    return mergeByPk(
        await g.dbl.playerStats.index("pid, season, tid").getAll(backboard.bound([pid], [pid, ''])),
        await g.cache.indexGetAll('playerStatsAllByPid', pid),
        g.cache.storeInfos.playerStats.pk,
    );
};

export default getCopy;
