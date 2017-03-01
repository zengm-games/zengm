import {g, helpers} from '../../../common';
import {idb} from '../../db';

const getCopy = ({
    season,
}: {
    season: number,
} = {}): Promise<any> => {
    if (season === g.season) {
        return idb.cache.get('playoffSeries', season);
    }

    return helpers.deepCopy(idb.league.playoffSeries.get(season));
};

export default getCopy;
