import iterate from "./iterate";
import type {
	IDBPObjectStore,
	IDBPIndex,
	StoreNames,
	StoreValue,
	IndexNames,
} from "idb";
import type { LeagueDB } from "./connectLeague";

/**
 * This is used for two separate purposes.
 *
 * First use case: When fetching objects from IndexedDB without using an index, sometimes it is tempting to do IDBObjectStore.getAll and then use Array.filter to filter the objects. This reads the entire object store (or index) into memory, which can be bad if it's large. Instead, it is better to iterate over the objects and only save the ones in memory that match your criteria. This is what this function does, if you pass the "cb" function. "cb" is the same as Array.filter - return true to keep, false to skip.
 *
 * Second use case: Sometimes you really do want to read all of an object store (or index) into memory. In that case, IDBObjectStore.getAll is appropriate, even if it's slow and uses a lot of memory. However Chrome will error with "Maximum IPC message size exceeded" if the requested data is too large. This happens even when the data is easily small enough to fit in memory. To work around that, you can't use getAll, instead you need to iterate over records and build the array yourself. This is how this function works if you leave off the "cb" argument.
 **/
const getAll = async <StoreName extends StoreNames<LeagueDB>>(
	store:
		| IDBPObjectStore<LeagueDB, StoreNames<LeagueDB>[], StoreName>
		| IDBPIndex<
				LeagueDB,
				StoreNames<LeagueDB>[],
				StoreName,
				IndexNames<LeagueDB, StoreName>
		  >,
	key?: any,
	cb?: (a: StoreValue<LeagueDB, StoreName>) => boolean,
) => {
	const objs: StoreValue<LeagueDB, StoreName>[] = [];

	await iterate(store, key, undefined, value => {
		if (cb === undefined || cb(value)) {
			objs.push(value);
		}
	});

	return objs;
};

export default getAll;
