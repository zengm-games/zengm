import { helpers } from "../../util/index.ts";
import type { Store } from "../Cache.ts";
import { idb } from "../../db/index.ts";
import type { GetCopyType } from "../../../common/types.ts";

// When "noCopyCache" is passed, that means we promise not to mutate any of these records, so we don't need to deepCopy
export const maybeDeepCopy = <T>(row: T, type: GetCopyType | undefined) =>
	type === "noCopyCache" ? row : helpers.deepCopy(row);

// Merge fromDb and fromCache by primary key. Records in fromCache will overwrite records in fromDb, and then extra records will be appended to end. Return value is cloned.
export const mergeByPk = <
	MyStore extends Store,
	PrimaryKey extends (typeof idb.cache.storeInfos)[MyStore]["pk"],
	T extends Record<PrimaryKey, any>,
>(
	fromDb: T[],
	fromCache: T[],
	storeName: MyStore,
	type: GetCopyType | undefined,
): T[] => {
	const cacheKeys: {
		[key: string]: number;
	} = {};
	const cacheKeysUsed: {
		[key: string]: boolean;
	} = {};

	const pk = idb.cache.storeInfos[storeName].pk as PrimaryKey;

	for (const [i, row] of fromCache.entries()) {
		cacheKeys[row[pk]] = i;
		cacheKeysUsed[row[pk]] = false;
	}

	const output = fromDb
		.filter((row) => {
			// Filter out rows if they have been deleted from the cache, but not yet persisted to IndexedDB
			return !idb.cache._deletes[storeName].has(row[pk]);
		})
		.map((row) => {
			const key = row[pk];

			if (cacheKeys[key] !== undefined) {
				cacheKeysUsed[key] = true;
				return maybeDeepCopy(fromCache[cacheKeys[key]]!, type);
			}

			return row;
		});

	for (const key of Object.keys(cacheKeys)) {
		if (!cacheKeysUsed[key]) {
			const i = cacheKeys[key]!;
			output.push(maybeDeepCopy(fromCache[i]!, type));
		}
	}

	return output;
};
