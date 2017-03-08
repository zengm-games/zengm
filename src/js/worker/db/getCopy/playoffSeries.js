// @flow

import {g, helpers} from '../../../common';
import {idb} from '../../db';
import type {PlayoffSeries} from '../../../common/types';

const getCopy = ({season}: {season: number} = {}): Promise<PlayoffSeries> => {
    if (season === g.season) {
        return idb.cache.playoffSeries.get(season);
    }

    return helpers.deepCopy(idb.league.playoffSeries.get(season));
};

export default getCopy;
