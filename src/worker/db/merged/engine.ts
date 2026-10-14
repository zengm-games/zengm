import { g, helpers } from "../../util/index.ts";
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

export type GetOptions = {
	// Rows from the cache are the same objects that are stored in the cache, so they must not be mutated unless copy is true
	copy?: boolean;
};

export type GetAllOptions<MyRow, Output = MyRow> = GetOptions & {
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
			// Must return every row in IndexedDB that matches the query. It's fine to return extra rows, because matches is applied after. Leave this undefined if every matching row is guaranteed to be in the cache.
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

const makeToOutput = <MyRow, Output>({
	copy,
	map,
}: GetAllOptions<MyRow, Output>) => {
	return (row: MyRow, fromCache: boolean): Output => {
		// Rows from IndexedDB are already new objects
		const row2 = copy && fromCache ? helpers.deepCopy(row) : row;

		if (map) {
			return map(row2);
		}

		// With no map function, Output is MyRow
		return row2 as unknown as Output;
	};
};

// Rows with these primary keys, skipping over the rows in between them - https://gist.github.com/inexorabletash/704e9688f99ac12dd336
async function* rowsWithKeysFromDb<MyStore extends Store>(
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

const getAllWithKeys = async <MyStore extends Store, Output>(
	storeName: MyStore,
	keys: readonly number[],
	options: GetAllOptions<Row<MyStore>, Output>,
) => {
	const pk = storeInfos[storeName].pk;
	const toOutput = makeToOutput(options);

	const rows = new Map<number, { row: Row<MyStore>; fromCache: boolean }>();

	const store = cacheStore(storeName);
	const cacheByKey = await store.getAllByKey();
	const keysForDb = [];
	for (const key of new Set(keys)) {
		const row = cacheByKey[key];
		if (row !== undefined) {
			rows.set(key, { row, fromCache: true });
		} else if (!store.hasPendingDelete(key)) {
			keysForDb.push(key);
		}
	}

	for await (const { value } of rowsWithKeysFromDb(storeName, keysForDb)) {
		rows.set((value as any)[pk], { row: value, fromCache: false });
	}

	const output = [];
	for (const key of keys) {
		const info = rows.get(key);
		if (info && (!options.filter || options.filter(info.row))) {
			output.push(toOutput(info.row, info.fromCache));
		}
	}

	return output;
};

// Get one row by primary key, from the cache if it's there and otherwise from IndexedDB
export const get = async <MyStore extends Store>(
	storeName: MyStore,
	key: Key,
	{ copy }: GetOptions = {},
): Promise<Row<MyStore> | undefined> => {
	const store = cacheStore(storeName);
	const row = await store.get(key);
	if (row !== undefined) {
		return copy ? helpers.deepCopy(row) : row;
	}

	if (store.hasPendingDelete(key)) {
		return undefined;
	}

	return idb.league.get(storeName, key as any);
};

// Get all rows matching a query, merging the cache and IndexedDB. A row in the cache always takes priority over the same row in IndexedDB. With no query, this returns the whole store.
export const getAll = async <MyStore extends Store, Output = Row<MyStore>>(
	storeName: MyStore,
	query: Query<Row<MyStore>> = {
		fromDb: () => idb.league.transaction(storeName).store.iterate(),
	},
	options: GetAllOptions<Row<MyStore>, Output> = {},
): Promise<Output[]> => {
	if ("keys" in query) {
		return getAllWithKeys(storeName, query.keys, options);
	}

	const { fromDb, fromCache, matches } = query;
	const { filter } = options;
	const pk = storeInfos[storeName].pk;
	const toOutput = makeToOutput(options);

	const output: Output[] = [];
	const seen = new Set<Key>();

	const add = (row: Row<MyStore>, rowFromCache: boolean) => {
		if ((matches && !matches(row)) || (filter && !filter(row))) {
			return;
		}

		output.push(toOutput(row, rowFromCache));
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

		const rowCache = cacheByKey[key];
		if (rowCache !== undefined) {
			add(rowCache, true);
		} else {
			add(row, false);
		}
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
			add(row, true);
		}
	}

	return output;
};

// Like the same store in idb.cache or idb.league, except it merges the data in both. Subclasses can support selectors by overriding toQuery, or override get and getAll if something else is different about a store.
export class MergedStore<MyStore extends Store, Selector = undefined> {
	readonly storeName: MyStore;

	// For stores where the primary key is season and the cache always has the current season (see getData in Cache.ts). Then if the current season is not in the cache, it doesn't exist at all, so there's no need to check IndexedDB.
	readonly currentSeasonInCache: boolean;

	constructor(
		storeName: MyStore,
		{ currentSeasonInCache = false }: { currentSeasonInCache?: boolean } = {},
	) {
		this.storeName = storeName;
		this.currentSeasonInCache = currentSeasonInCache;
	}

	// Returning undefined means the whole store
	protected toQuery(
		selector: Selector | undefined,
	): Query<Row<MyStore>> | undefined {
		if (selector === undefined) {
			return undefined;
		}

		throw new Error("Invalid selector");
	}

	async get(
		key: LeagueDB[MyStore]["key"],
		options: GetOptions = {},
	): Promise<Row<MyStore> | undefined> {
		if (this.currentSeasonInCache && key === g.get("season")) {
			const row = await cacheStore(this.storeName).get(key);
			return row !== undefined && options.copy ? helpers.deepCopy(row) : row;
		}

		return get(this.storeName, key, options);
	}

	// async so an error from toQuery is a rejected promise, like any other error in getAll
	async getAll<Output = Row<MyStore>>(
		selector?: Selector,
		options?: GetAllOptions<Row<MyStore>, Output>,
	) {
		return await getAll(this.storeName, this.toQuery(selector), options);
	}
}
