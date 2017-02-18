import {deepCopy} from '../../util/helpers';

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
    // eslint-disable-next-line import/prefer-default-export
    mergeByPk,
};
