import { openDB } from "idb";
import type { IDBPCursorWithValue } from "idb";
import {
	gameAttributesArrayToObject,
	MAX_SUPPORTED_LEAGUE_VERSION,
} from "../../common";
import { gameAttributesCache } from "../../common/defaultGameAttributes";
import { local } from "./local";
import toWorker from "./toWorker";
import type { LeagueDB } from "../../worker/db/connectLeague";

// Otherwise it often pulls just one record per transaction, as it's hitting up against the high water mark
const TWENTY_MEGABYTES_IN_BYTES = 20 * 1024 * 1024;

// If we just let the normal highWaterMark mechanism work, it might pull only one record at a time, which is not ideal given the cost of starting a transaction. Make it too high, and the progress bar becomes unrealistic (especially when uploading to Dropbox which is slower than writing to disk) because it is measured from reading the database, not the end of the stream.
const highWaterMark = TWENTY_MEGABYTES_IN_BYTES;
const minSizePerPull = TWENTY_MEGABYTES_IN_BYTES;

const stringSizeInBytes = (str: string | undefined) => {
	if (!str) {
		return 0;
	}

	// https://stackoverflow.com/a/23329386/786644
	let s = str.length;
	for (let i = str.length - 1; i >= 0; i--) {
		const code = str.charCodeAt(i);
		if (code > 0x7f && code <= 0x7ff) s++;
		else if (code > 0x7ff && code <= 0xffff) s += 2;
		if (code >= 0xdc00 && code <= 0xdfff) i--;
	}
	return s;
};

const NUM_SPACES_IN_TAB = 2;

type Filter = (a: any) => boolean;

const makeExportStream = async (
	storesInput: string[],
	{
		compressed = false,
		filter = {},
		forEach = {},
		map = {},
		name,
		hasHistoricalData,
		onPercentDone,
		onProcessingStore,
	}: {
		compressed: boolean;
		filter?: {
			[key: string]: Filter;
		};
		forEach?: {
			[key: string]: (a: any) => void;
		};
		map?: {
			[key: string]: (a: any) => any;
		};
		name?: string;
		hasHistoricalData?: boolean;
		onPercentDone?: (percentDone: number) => void;
		onProcessingStore?: (processingStore: string) => void;
	},
) => {
	const lid = local.getState().lid;
	if (lid === undefined) {
		throw new Error("Missing lid");
	}

	// Don't worry about upgrades or anything, because this function will only be called if the league database already exists
	const leagueDB = await openDB<LeagueDB>(
		`league${lid}`,
		MAX_SUPPORTED_LEAGUE_VERSION,
		{
			blocking() {
				leagueDB.close();
			},
		},
	);

	// Always flush before export, so export is current!
	await toWorker("main", "idbCacheFlush", undefined);

	const space = compressed ? "" : " ";
	const tab = compressed ? "" : " ".repeat(NUM_SPACES_IN_TAB);
	const newline = compressed ? "" : "\n";

	const jsonStringify = (object: any, indentationLevels: number) => {
		if (compressed) {
			return JSON.stringify(object);
		}

		const json = JSON.stringify(object, null, NUM_SPACES_IN_TAB);

		return json.replace(/\n/g, `\n${tab.repeat(indentationLevels)}`);
	};

	const stores = storesInput.filter(
		store => store !== "teamSeasons" && store !== "teamStats",
	);
	const includeTeamSeasonsAndStats = stores.length !== storesInput.length;

	const writeRootObject = (
		controller: ReadableStreamController<string>,
		name: string,
		object: any,
	) =>
		controller.enqueue(
			`,${newline}${tab}"${name}":${space}${jsonStringify(object, 1)}`,
		);

	let storeIndex = 0;
	let prevKey: string | number | undefined;
	let prevStore: string | undefined;
	let cancelCallback: (() => void) | undefined;
	const enqueuedFirstRecord = new Set();

	let hasGameAttributesStartingSeason = false;

	let numRecordsSeen = 0;
	let numRecordsTotal = 0;
	let prevPercentDone = 0;
	const incrementNumRecordsSeen = (count: number = 1) => {
		numRecordsSeen += count;
		if (onPercentDone) {
			const percentDone = Math.round((numRecordsSeen / numRecordsTotal) * 100);
			if (percentDone !== prevPercentDone) {
				onPercentDone(percentDone);
				prevPercentDone = percentDone;
			}
		}
	};

	return new ReadableStream<string>(
		{
			async start(controller) {
				const tx = leagueDB.transaction(storesInput as any);
				for (const store of storesInput) {
					if (store === "gameAttributes") {
						numRecordsTotal += 1;
					} else {
						numRecordsTotal += await tx.objectStore(store).count();
					}
				}

				await controller.enqueue(
					`{${newline}${tab}"version":${space}${MAX_SUPPORTED_LEAGUE_VERSION}`,
				);

				// If name is specified, include it in meta object. Currently this is only used when importing leagues, to set the name
				if (name) {
					await writeRootObject(controller, "meta", { name });
				}
			},

			async pull(controller) {
				// console.log("PULL", controller.desiredSize / 1024 / 1024);
				const done = () => {
					if (cancelCallback) {
						cancelCallback();
					}

					controller.close();

					leagueDB.close();
				};

				if (cancelCallback) {
					done();
					return;
				}

				// let count = 0;
				let size = 0;

				const enqueue = (string: string) => {
					size += stringSizeInBytes(string);
					controller.enqueue(string);
				};

				const store = stores[storeIndex];
				if (onProcessingStore && store !== prevStore) {
					onProcessingStore(store);
				}

				// Define this up here so it is undefined for gameAttributes, triggering the "go to next store" logic at the bottom
				let cursor:
					| IDBPCursorWithValue<LeagueDB, any, any, unknown, "readonly">
					| null
					| undefined;

				if (store === "gameAttributes") {
					// gameAttributes is special because we need to convert it into an object
					let rows = (await leagueDB.getAll(store)).filter(
						row => !gameAttributesCache.includes(row.key),
					);

					if (filter[store]) {
						rows = rows.filter(filter[store]);
					}

					if (forEach[store]) {
						for (const row of rows) {
							forEach[store](row);
						}
					}

					if (map[store]) {
						rows = rows.map(map[store]);
					}

					const gameAttributesObject = gameAttributesArrayToObject(rows);

					hasGameAttributesStartingSeason =
						gameAttributesObject.startingSeason !== undefined;

					await writeRootObject(
						controller,
						"gameAttributes",
						gameAttributesObject,
					);

					incrementNumRecordsSeen();
				} else {
					const txStores =
						store === "teams" ? ["teams", "teamSeasons", "teamStats"] : [store];

					const transaction = leagueDB.transaction(txStores as any);

					const range =
						prevKey !== undefined
							? IDBKeyRange.lowerBound(prevKey, true)
							: undefined;
					cursor = await transaction.objectStore(store).openCursor(range);
					while (cursor) {
						let value = cursor.value;

						if (!filter[store] || filter[store](value)) {
							// count += 1;

							const enqueuedFirst = enqueuedFirstRecord.has(store);
							const comma = enqueuedFirst ? "," : "";

							if (!enqueuedFirst) {
								enqueue(`,${newline}${tab}"${store}": [`);
								enqueuedFirstRecord.add(store);
							}

							if (forEach[store]) {
								forEach[store](value);
							}
							if (store === "players") {
								if (value.imgURL) {
									delete value.face;
								}
							}

							if (map[store]) {
								value = map[store](value);
							}

							if (store === "teams" && includeTeamSeasonsAndStats) {
								// This is a bit dangerous, since it will possibly read all teamStats/teamSeasons rows into memory, but that will very rarely exceed MIN_RECORDS_PER_PULL and we will just do one team per transaction, to be safe.

								const tid = value.tid;

								const infos: (
									| {
											key: string;
											store: "teamSeasons";
											index: "tid, season";
											keyRange: IDBKeyRange;
									  }
									| {
											key: string;
											store: "teamStats";
											index: "tid";
											keyRange: IDBKeyRange;
									  }
								)[] = [
									{
										key: "seasons",
										store: "teamSeasons",
										index: "tid, season",
										keyRange: IDBKeyRange.bound([tid], [tid, ""]),
									},
									{
										key: "stats",
										store: "teamStats",
										index: "tid",
										keyRange: IDBKeyRange.only(tid),
									},
								];

								const t: any = value;

								for (const info of infos) {
									t[info.key] = [];
									let cursor2 = await transaction
										.objectStore(info.store)
										.index(info.index as any)
										.openCursor(info.keyRange);
									while (cursor2) {
										t[info.key].push(cursor2.value);
										cursor2 = await cursor2.continue();
									}
									incrementNumRecordsSeen(t[info.key].length);
								}
							}

							enqueue(
								`${comma}${newline}${tab.repeat(2)}${jsonStringify(value, 2)}`,
							);
						}

						incrementNumRecordsSeen();

						prevKey = cursor.key as any;

						const desiredSize = (controller as any).desiredSize;
						if ((desiredSize > 0 || size < minSizePerPull) && !cancelCallback) {
							// Keep going if desiredSize or minSizePerPull want us to
							cursor = await cursor.continue();
						} else {
							break;
						}
					}
				}

				// console.log("PULLED", count, size / 1024 / 1024);
				if (!cursor) {
					// Actually done with this store - we didn't just stop due to desiredSize
					storeIndex += 1;
					prevKey = undefined;
					if (enqueuedFirstRecord.has(store)) {
						enqueue(`${newline}${tab}]`);
					} else {
						// Ensure we don't ever enqueue nothing, in which case the stream can get stuck
						enqueue("");
					}

					if (storeIndex >= stores.length) {
						// Done whole export!

						if (
							!stores.includes("gameAttributes") ||
							(hasHistoricalData && !hasGameAttributesStartingSeason)
						) {
							// Set startingSeason if gameAttributes is not selected, otherwise it's going to fail loading unless startingSeason is coincidentally the same as the default
							await writeRootObject(
								controller,
								"startingSeason",
								(
									await leagueDB.get("gameAttributes", "startingSeason")
								)?.value,
							);
						}

						await controller.enqueue(`${newline}}${newline}`);

						done();
					}
				}
			},
			cancel() {
				return new Promise(resolve => {
					cancelCallback = resolve;
				});
			},
		},
		{
			highWaterMark,
			size: stringSizeInBytes,
		},
	);
};

export default makeExportStream;
