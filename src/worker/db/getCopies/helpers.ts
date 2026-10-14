import { storeInfos, type Store } from "../Cache.ts";
import { cacheStore } from "../merged/engine.ts";

// Merge fromDb and fromCache by primary key. Records in fromCache will overwrite records in fromDb, and then extra records will be appended to end. Records from the cache are not copied, so don't mutate them.
export const mergeByPk = <
	MyStore extends Store,
	PrimaryKey extends (typeof storeInfos)[MyStore]["pk"],
	T extends Record<PrimaryKey, any>,
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

	const pk = storeInfos[storeName].pk as PrimaryKey;

	for (const [i, row] of fromCache.entries()) {
		cacheKeys[row[pk]] = i;
		cacheKeysUsed[row[pk]] = false;
	}

	const output = fromDb
		.filter((row) => {
			// Filter out rows if they have been deleted from the cache, but not yet persisted to IndexedDB
			return !cacheStore(storeName).hasPendingDelete(row[pk]);
		})
		.map((row) => {
			const key = row[pk];

			if (cacheKeys[key] !== undefined) {
				cacheKeysUsed[key] = true;
				return fromCache[cacheKeys[key]]!;
			}

			return row;
		});

	for (const key of Object.keys(cacheKeys)) {
		if (!cacheKeysUsed[key]) {
			const i = cacheKeys[key]!;
			output.push(fromCache[i]!);
		}
	}

	return output;
};
