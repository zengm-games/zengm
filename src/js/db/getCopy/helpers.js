import orderBy from 'lodash.orderby';
import {deepCopy} from '../../util/helpers';

// Indexes can't handle playoffs/regularSeason and different ones can come back inconsistently sorted
const filterOrderStats = (stats, playoffs, regularSeason) => {
    stats.filter((ps) => {
        if (playoffs && ps.playoffs) {
            return true;
        }
        if (regularSeason && !ps.playoffs) {
            return true;
        }
        return false;
    });

    return orderBy(stats, ['season', 'playoffs', 'psid', 'rid']);
};

// Merge fromDb and fromCache by primary key. Records in fromCache will overwrite records in fromDb, and then extra records will be appended to end. Return value is cloned.
const mergeByPk = (fromDb: any[], fromCache: any[], pk: string) => {
    const cacheKeys = {};
    const cacheKeysUsed = {};
    for (let i = 0; i < fromCache.length; i++) {
        cacheKeys[fromCache[i][pk]] = i;
        cacheKeysUsed[fromCache[i][pk]] = false;
    }

    const output = fromDb.map((row) => {
        const key = row[pk];
        if (cacheKeys.hasOwnProperty(key)) {
            cacheKeysUsed[key] = true;
            return deepCopy(fromCache[cacheKeys[key]]);
        }
        return row;
    });

    for (const [key, i] of Object.entries(cacheKeys)) {
        if (!cacheKeysUsed[key]) {
            output.push(deepCopy(fromCache[i]));
        }
    }

    return output;
};

export {
    filterOrderStats,
    mergeByPk,
};
