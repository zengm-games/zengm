import g from '../../globals';
//import {mergeByPk} from './helpers';
import * as helpers from '../../util/helpers';
import type {Player} from '../../util/types';

const getCopy = async ({
    pid,
}: {
    pid: number,
}): Promise<(Player | Player[])> => {
    if (pid !== undefined) {
        const cachedPlayer = await g.cache.get('players', pid);
        if (cachedPlayer) {
            return helpers.deepCopy(cachedPlayer);
        }

        return g.dbl.players.get(pid);
    }
};

export default getCopy;
