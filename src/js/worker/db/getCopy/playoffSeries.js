import g from '../../../globals';
import {deepCopy} from '../../../util/helpers';

const getCopy = ({
    season,
}: {
    season: number,
} = {}): Promise<any> => {
    if (season === g.season) {
        return g.cache.get('playoffSeries', season);
    }

    return deepCopy(g.dbl.playoffSeries.get(season));
};

export default getCopy;
