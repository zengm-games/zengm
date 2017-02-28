import {g} from '../../../common';
import {deepCopy} from '../../../util/helpers';
import {idb} from '../../db';

const getCopy = ({
    season,
}: {
    season: number,
} = {}): Promise<any> => {
    if (season === g.season) {
        return idb.cache.get('playoffSeries', season);
    }

    return deepCopy(idb.league.playoffSeries.get(season));
};

export default getCopy;
