import g from '../../../globals';
import {deepCopy} from '../../../util/helpers';
import {idb} from '../../db';

const getCopy = ({
    season,
}: {
    season: number,
} = {}): Promise<any> => {
    if (season === g.season) {
        return g.cache.get('playoffSeries', season);
    }

    return deepCopy(idb.league.playoffSeries.get(season));
};

export default getCopy;
