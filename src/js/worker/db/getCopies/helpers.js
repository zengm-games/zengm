// @flow

import { helpers } from "../../util";

// Merge fromDb and fromCache by primary key. Records in fromCache will overwrite records in fromDb, and then extra records will be appended to end. Return value is cloned.
const mergeByPk = <T: { [key: string]: any }>(
    fromDb: T[],
    fromCache: T[],
    pk: string,
): T[] => {
    const cacheKeys: { [key: string]: number } = {};
    const cacheKeysUsed: { [key: string]: boolean } = {};
    for (let i = 0; i < fromCache.length; i++) {
        cacheKeys[fromCache[i][pk]] = i;
        cacheKeysUsed[fromCache[i][pk]] = false;
    }

    const output = fromDb.map(row => {
        const key = row[pk];
        if (cacheKeys.hasOwnProperty(key)) {
            cacheKeysUsed[key] = true;
            return helpers.deepCopy(fromCache[cacheKeys[key]]);
        }
        return row;
    });

    for (const key of Object.keys(cacheKeys)) {
        if (!cacheKeysUsed[key]) {
            const i = cacheKeys[key];
            output.push(helpers.deepCopy(fromCache[i]));
        }
    }

    return output;
};

// eslint-disable-next-line import/prefer-default-export
export { mergeByPk };
