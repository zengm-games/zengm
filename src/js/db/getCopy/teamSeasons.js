// @flow

import backboard from 'backboard';
import g from '../../globals';
import {mergeByPk} from './helpers';
import type {TeamSeason} from '../../util/types';

const getCopy = async ({tid, seasons}: {tid: number, seasons?: [number, number]} = {}): Promise<TeamSeason[]> => {
    if (seasons !== undefined) {
        return mergeByPk(
            await g.dbl.teamSeasons.index("tid, season").getAll(backboard.bound([tid, seasons[0]], [tid, seasons[1]])),
            await g.cache.indexGetAll('teamSeasonsByTidSeason', [`${tid},${seasons[0]}`, `${tid},${seasons[1]}`]),
            g.cache.storeInfos.teamSeasons.pk,
        );
    }

    return mergeByPk(
        await g.dbl.teamSeasons.index('tid, season').getAll(backboard.bound([tid], [tid, ''])),
        await g.cache.indexGetAll('teamSeasonsByTidSeason', [`${tid}`, `${tid + 1}`]),
        g.cache.storeInfos.teamSeasons.pk,
    );
};

export default getCopy;
