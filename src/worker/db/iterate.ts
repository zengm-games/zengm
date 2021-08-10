import { unwrap } from "idb";
import type {
	IDBPObjectStore,
	IDBPIndex,
	StoreNames,
	StoreValue,
	IndexNames,
	StoreKey,
} from "idb";
import type { LeagueDB } from "./connectLeague";

// Helper function to use cursors to iterate over an index or object store, without awaiting a promise (for Firefox <60 support).
// If you don't care about Firefox <60 for a feature and want to use await in the callback, just use a cursor and loop from idb https://github.com/jakearchibald/idb#idbcursor-enhancements
const iterate = async <StoreName extends StoreNames<LeagueDB>>(
	store:
		| IDBPObjectStore<
				LeagueDB,
				StoreNames<LeagueDB>[],
				StoreName,
				IDBTransactionMode
		  >
		| IDBPIndex<
				LeagueDB,
				StoreNames<LeagueDB>[],
				StoreName,
				IndexNames<LeagueDB, StoreName>,
				IDBTransactionMode
		  >,
	key: StoreKey<LeagueDB, StoreName> | IDBKeyRange | undefined = undefined,
	direction: "next" | "nextunique" | "prev" | "prevunique" = "next",
	callback: (
		value: StoreValue<LeagueDB, StoreName>,
		shortCircuit: () => void,
	) => StoreValue<LeagueDB, StoreName> | void,
) => {
	// @ts-ignore
	const unwrapped: IDBObjectStore | IDBIndex = unwrap(store);

	return new Promise<void>((resolve, reject) => {
		const request = unwrapped.openCursor(key, direction);

		request.onsuccess = (event: any) => {
			const cursor = event.target.result;

			if (cursor) {
				let shortCircuit = false;

				const shortCircuitFunction = () => {
					shortCircuit = true;
				};

				const callbackResult = callback(cursor.value, shortCircuitFunction);

				try {
					// Only update if return value is not undefined
					if (callbackResult !== undefined) {
						cursor.update(callbackResult);
					}

					if (shortCircuit) {
						resolve();
					} else {
						cursor.continue();
					}
				} catch (err) {
					reject(err);
				}
			} else {
				resolve();
			}
		};

		request.onerror = (event: any) => {
			reject(event.target.error);
		};
	});
};

export default iterate;
