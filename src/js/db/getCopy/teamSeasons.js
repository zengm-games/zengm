// @flow

import backboard from 'backboard';
import g from '../../globals';
import {mergeByPk} from './helpers';
import type {TeamSeason} from '../../util/types';

const getCopy = async ({tid}: {tid: number}): Promise<TeamSeason[]> => {
    return mergeByPk(
        await g.dbl.teamSeasons.index('tid, season').getAll(backboard.bound([tid], [tid, ''])),
        await g.cache.indexGetAll('teamSeasonsByTidSeason', [`${g.userTid}`, `${g.userTid + 1}`]),
        g.cache.storeInfos.teamSeasons.pk,
    );
};

export default getCopy;
