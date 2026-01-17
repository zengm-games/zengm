import { unwrap } from "@dumbmatter/idb";
import type {
	IDBPObjectStore,
	IDBPIndex,
	StoreNames,
	StoreValue,
	IndexNames,
	StoreKey,
} from "@dumbmatter/idb";
import type { LeagueDB } from "./connectLeague.ts";

// This should never be used! It's just left here for worker console backwards compatibility.
// Instead, use async iterators https://github.com/jakearchibald/idb#idbcursor-enhancements
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
	key: StoreKey<LeagueDB, StoreName> | IDBKeyRange | undefined,
	direction: "next" | "nextunique" | "prev" | "prevunique" = "next",
	callback: (
		value: StoreValue<LeagueDB, StoreName>,
		shortCircuit: () => void,
	) => StoreValue<LeagueDB, StoreName> | void,
) => {
	// @ts-expect-error
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
				} catch (error) {
					reject(error);
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
