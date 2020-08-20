import { helpers } from "../../util";
import type { Store } from "../Cache";
import { idb } from "../../db";

// Merge fromDb and fromCache by primary key. Records in fromCache will overwrite records in fromDb, and then extra records will be appended to end. Return value is cloned.
const mergeByPk = <
	MyStore extends Store,
	PrimaryKey extends typeof idb.cache.storeInfos[MyStore]["pk"],
	T extends Record<PrimaryKey, any>
>(
	fromDb: T[],
	fromCache: T[],
	storeName: MyStore,
): T[] => {
	const cacheKeys: {
		[key: string]: number;
	} = {};
	const cacheKeysUsed: {
		[key: string]: boolean;
	} = {};

	const pk = idb.cache.storeInfos[storeName].pk as PrimaryKey;

	for (let i = 0; i < fromCache.length; i++) {
		cacheKeys[fromCache[i][pk]] = i;
		cacheKeysUsed[fromCache[i][pk]] = false;
	}

	const output = fromDb
		.filter(row => {
			// Filter out rows if they have been deleted from the cache, but not yet persisted to IndexedDB
			return !idb.cache._deletes[storeName].has(row[pk]);
		})
		.map(row => {
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
