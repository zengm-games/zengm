import { g } from "../../util/index.ts";
import { storeInfos, type Store, type StoreAPI } from "../Cache.ts";
import type { LeagueDB } from "../connectLeague.ts";
import { idb } from "../index.ts";

export type Row<MyStore extends Store> = LeagueDB[MyStore]["value"];

type Key = number | string;

// TypeScript can't tell that idb.cache[storeName] is the StoreAPI for Row<MyStore> when storeName is generic
export const cacheStore = <MyStore extends Store>(storeName: MyStore) => {
	return idb.cache[storeName] as unknown as StoreAPI<
		unknown,
		Row<MyStore>,
		Key
	>;
};

// Rows read from IndexedDB, either one at a time from a cursor (like from iterate) or all at once (like from getAll).
//
// Use a cursor by default, so rows that are not kept don't stay in memory. This is also needed for large results, because Chrome will error with "Maximum IPC message size exceeded" if too much data is requested with getAll.
//
// getAll is faster, so it's better for queries that return a moderate amount of data and are run often.
export type DbRows<MyRow> = AsyncIterable<{ value: MyRow }> | Promise<MyRow[]>;

export type GetAllOptions<MyRow, Output = MyRow> = {
	filter?: (row: MyRow) => boolean;

	// Only the return value of map is kept in memory, so use this when reading many rows but only needing a little data from each. Like filter, this runs inside an IndexedDB transaction, so it must be synchronous.
	map?: (row: MyRow) => Output;
};

export type Query<MyRow> =
	| {
			// Rows with these primary keys, in this order. Keys with no row are skipped.
			keys: readonly number[];
	  }
	| {
			// Must return every row in IndexedDB that matches the query. It's fine to return extra rows in some cases, because matches is applied after. Leave this undefined if every matching row is guaranteed to be in the cache. Default is the whole store.
			fromDb?: () => DbRows<MyRow>;

			// Must return every row in the cache that matches the query, default is the whole store
			fromCache?: () => Promise<MyRow[]>;

			// Applied to rows after merging the cache and IndexedDB, so if a row no longer matches because it changed in the cache, it's not returned
			matches?: (row: MyRow) => boolean;
	  };

type AllKeys<T> = T extends unknown ? keyof T : never;

// For a union of selector objects, don't allow properties from different members of the union to be used together
export type Exclusive<T, All = T> = T extends unknown
	? T & Partial<Record<Exclude<AllKeys<All>, keyof T>, never>>
	: never;

const makeToOutput = <MyRow, Output>({ map }: GetAllOptions<MyRow, Output>) => {
	return (row: MyRow): Output => {
		if (map) {
			return map(row);
		}

		// With no map function, Output is MyRow
		return row as unknown as Output;
	};
};

// Rows with these primary keys, skipping over the rows in between them - https://gist.github.com/inexorabletash/704e9688f99ac12dd336
async function* rowsByKeysFromDb<MyStore extends Store>(
	storeName: MyStore,
	keys: number[],
) {
	const sortedKeys = keys.toSorted((a, b) => a - b);
	const min = sortedKeys[0];
	const max = sortedKeys.at(-1);
	if (min === undefined || max === undefined) {
		return;
	}

	const store = idb.league.transaction(storeName).store;

	let i = 0;
	for await (const cursor of store.iterate(IDBKeyRange.bound(min, max))) {
		const currentKey = cursor.key as number;

		// Keys before the cursor are not in the database
		let nextKey = sortedKeys[i];
		while (nextKey !== undefined && nextKey < currentKey) {
			i += 1;
			nextKey = sortedKeys[i];
		}

		if (nextKey === currentKey) {
			yield cursor;
			i += 1;
			nextKey = sortedKeys[i];
		}

		if (nextKey === undefined) {
			break;
		}

		// nextKey is always greater than currentKey, which is required by cursor.continue
		cursor.continue(nextKey as any);
	}
}

// Rows with these primary keys, in this order
const getAllByKeys = async <MyStore extends Store>(
	storeName: MyStore,
	keys: readonly number[],
) => {
	const pk = storeInfos[storeName].pk;

	const rows = new Map<number, Row<MyStore>>();

	const store = cacheStore(storeName);
	const cacheByKey = await store.getAllByKey();
	const keysForDb = [];
	for (const key of new Set(keys)) {
		const row = cacheByKey[key];
		if (row !== undefined) {
			rows.set(key, row);
		} else if (!store.hasPendingDelete(key)) {
			keysForDb.push(key);
		}
	}

	for await (const { value } of rowsByKeysFromDb(storeName, keysForDb)) {
		rows.set((value as any)[pk], value);
	}

	const output = [];
	for (const key of keys) {
		const row = rows.get(key);
		if (row) {
			output.push(row);
		}
	}

	return output;
};

// Get one row by primary key, from the cache if it's there and otherwise from IndexedDB
export const get = async <MyStore extends Store>(
	storeName: MyStore,
	key: Key,
): Promise<Row<MyStore> | undefined> => {
	const store = cacheStore(storeName);
	const row = await store.get(key);
	if (row !== undefined) {
		return row;
	}

	if (store.hasPendingDelete(key)) {
		return undefined;
	}

	return idb.league.get(storeName, key);
};

// Call callback for each row matching a query, merging the cache and IndexedDB. A row in the cache always takes priority over the same row in IndexedDB. With no query, this is the whole store.
export const forEach = async <MyStore extends Store>(
	storeName: MyStore,
	query: Query<Row<MyStore>> = {
		fromDb: () => idb.league.transaction(storeName).store.iterate(),
	},
	callback: (row: Row<MyStore>) => void,
) => {
	if ("keys" in query) {
		for (const row of await getAllByKeys(storeName, query.keys)) {
			callback(row);
		}
		return;
	}

	const { fromDb, fromCache, matches } = query;
	const pk = storeInfos[storeName].pk;

	const seen = new Set<Key>();

	const add = (row: Row<MyStore>) => {
		if (matches && !matches(row)) {
			return;
		}

		callback(row);
	};

	const store = cacheStore(storeName);

	// This is the cache's own object, not a copy, so it stays up to date if the cache changes while waiting on IndexedDB
	const cacheByKey = await store.getAllByKey();

	const addFromDb = (row: any) => {
		const key: Key = row[pk];
		if (seen.has(key)) {
			return;
		}
		seen.add(key);

		if (store.hasPendingDelete(key)) {
			return;
		}

		add(cacheByKey[key] ?? row);
	};

	if (fromDb) {
		const rows = fromDb();
		if (rows instanceof Promise) {
			for (const row of await rows) {
				addFromDb(row);
			}
		} else {
			for await (const { value } of rows) {
				addFromDb(value);
			}
		}
	}

	const rowsCache: any[] = fromCache ? await fromCache() : await store.getAll();
	for (const row of rowsCache) {
		const key: Key = row[pk];
		if (!seen.has(key)) {
			seen.add(key);
			add(row);
		}
	}
};

// Get all rows matching a query, merging the cache and IndexedDB. A row in the cache always takes priority over the same row in IndexedDB. With no query, this returns the whole store.
export const getAll = async <MyStore extends Store, Output = Row<MyStore>>(
	storeName: MyStore,
	query: Query<Row<MyStore>> | undefined,
	options: GetAllOptions<Row<MyStore>, Output> = {},
): Promise<Output[]> => {
	const { filter } = options;
	const toOutput = makeToOutput(options);

	const output: Output[] = [];
	await forEach(storeName, query, (row) => {
		if (filter && !filter(row)) {
			return;
		}

		output.push(toOutput(row));
	});

	return output;
};

// Like the same store in idb.cache or idb.league, except it merges the data in both. Subclasses can support selectors by overriding toQuery, or override get and getAll if something else is different about a store.
//
// Rows from the cache are the same objects that are stored in the cache, so they must not be mutated. To change a row, copy it first or put the changed row back in the cache when you're done.
export class MergedStore<MyStore extends Store, Selector = undefined> {
	readonly storeName: MyStore;

	// For stores where the primary key is season and the cache always has the current season (see getData in Cache.ts). Then if the current season is not in the cache, it doesn't exist at all, so there's no need to check IndexedDB.
	readonly currentSeasonInCache: boolean;

	// For stores that are small enough to read all at once. Then reading the whole store from IndexedDB uses one getAll call, which is faster than a cursor. Big stores use a cursor so that with a filter, rows that don't pass it are not all held in memory at once.
	readonly small: boolean;

	constructor(
		storeName: MyStore,
		{
			currentSeasonInCache = false,
			small = false,
		}: { currentSeasonInCache?: boolean; small?: boolean } = {},
	) {
		this.storeName = storeName;
		this.currentSeasonInCache = currentSeasonInCache;
		this.small = small;
	}

	// Returning undefined means the whole store
	protected toQuery(
		selector: Selector | undefined,
	): Query<Row<MyStore>> | undefined {
		if (selector === undefined) {
			if (this.small) {
				return {
					fromDb: () => idb.league.transaction(this.storeName).store.getAll(),
				};
			}

			return undefined;
		}

		throw new Error("Invalid selector");
	}

	get(key: LeagueDB[MyStore]["key"]): Promise<Row<MyStore> | undefined> {
		if (this.currentSeasonInCache && key === g.get("season")) {
			return cacheStore(this.storeName).get(key);
		}

		return get(this.storeName, key);
	}

	// async so an error from toQuery is a rejected promise, like any other error in getAll
	async getAll<Output = Row<MyStore>>(
		selector?: Selector,
		options?: GetAllOptions<Row<MyStore>, Output>,
	) {
		return await getAll(this.storeName, this.toQuery(selector), options);
	}

	// Like getAll, but rather than returning rows, this calls callback for each one. Use this when processing many rows without keeping them, so they're not all held in memory at once. callback runs inside an IndexedDB transaction, so it must be synchronous.
	async forEach(
		selector: Selector | undefined,
		callback: (row: Row<MyStore>) => void,
	) {
		await forEach(this.storeName, this.toQuery(selector), callback);
	}
}
