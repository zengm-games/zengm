// @flow

import backboard from 'backboard';
import g from '../../../globals';
import {mergeByPk} from './helpers';
import {deepCopy} from '../../../util/helpers';
import type {TeamSeason} from '../../../common/types';

const getCopy = async ({tid, season, seasons}: {tid?: number, season?: number, seasons?: [number, number]} = {}): Promise<TeamSeason[]> => {
    if (tid === undefined) {
        if (season !== undefined) {
            if (season >= g.season - 2) {
                // Single season, from cache
                return deepCopy(await g.cache.indexGetAll('teamSeasonsBySeasonTid', [`${season}`, `${season},Z`]));
            }
            // Single season, from database
            return g.dbl.teamSeasons.index("season, tid").getAll(backboard.bound([season], [season, '']));
        }

        throw new Error('getCopy.teamSeasons requires season if tid is undefined');
    }

    if (seasons !== undefined) {
        return mergeByPk(
            await g.dbl.teamSeasons.index("tid, season").getAll(backboard.bound([tid, seasons[0]], [tid, seasons[1]])),
            await g.cache.indexGetAll('teamSeasonsByTidSeason', [`${tid},${seasons[0]}`, `${tid},${seasons[1]}`]),
            g.cache.storeInfos.teamSeasons.pk,
        );
    }

    return mergeByPk(
        await g.dbl.teamSeasons.index('tid, season').getAll(backboard.bound([tid], [tid, ''])),
        await g.cache.indexGetAll('teamSeasonsByTidSeason', [`${tid}`, `${tid},Z`]),
        g.cache.storeInfos.teamSeasons.pk,
    );
};

export default getCopy;
