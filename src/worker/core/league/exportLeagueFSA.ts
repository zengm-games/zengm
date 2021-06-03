import type { StoreNames, StoreValue } from "idb";
import { gameAttributesArrayToObject } from "../../../common";
import { getAll, idb } from "../../db";
import type { LeagueDB } from "../../db/connectLeague";
import { g, local } from "../../util";
import getName from "./getName";

type Filter = (a: any) => boolean;

const exportLeagueFSA = async (
	fileHandle: FileSystemFileHandle,
	stores: string[],
	{
		compressed = false,
		meta = true,
		filter = {},
	}: {
		compressed?: boolean;
		meta?: boolean;
		filter?: {
			[key: string]: Filter;
		};
	} = {},
) => {
	// Otherwise it often pulls just one record per transaction, as it's hitting up against the high water mark
	const ONE_MEGABYTE_IN_BYTES = 1024 * 1024;

	// If we just let the normal highWaterMark mechanism work, it might pull only one record at a time, which is not ideal given the cost of starting a transaction
	const highWaterMark = ONE_MEGABYTE_IN_BYTES;
	const minSizePerPull = ONE_MEGABYTE_IN_BYTES;

	const stringSizeInBytes = (str: string) => {
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

	// Always flush before export, so export is current!
	await idb.cache.flush();

	const writable = await fileHandle.createWritable();

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

	const makeStoreStream = <Store extends StoreNames<LeagueDB>>(
		store: Store,
		{
			filter,
			forEach,
		}: {
			filter?: Filter;

			// Can mutate because this comes from IndexedDB
			forEach?: (row: StoreValue<LeagueDB, Store>) => void;
		},
	) => {
		let prevKey: LeagueDB[Store]["key"] | undefined;
		let cancelCallback: (() => void) | undefined;
		let seenFirstRecord = false;
		const stores: StoreNames<LeagueDB>[] =
			store === "teams" ? ["teams", "teamSeasons", "teamStats"] : [store];

		return new ReadableStream(
			{
				async pull(controller) {
					// console.log("PULL", controller.desiredSize / 1024 / 1024);
					const done = () => {
						if (cancelCallback) {
							cancelCallback();
						}

						controller.close();
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

					const transaction = idb.league.transaction(stores);

					const range =
						prevKey !== undefined
							? IDBKeyRange.lowerBound(prevKey, true)
							: undefined;
					let cursor = await transaction.objectStore(store).openCursor(range);
					while (cursor) {
						if (!filter || filter(cursor.value)) {
							// count += 1;

							const comma = seenFirstRecord ? "," : "";

							if (!seenFirstRecord) {
								enqueue(`,${newline}${tab}"${store}": [`);
								seenFirstRecord = true;
							}

							if (forEach) {
								forEach(cursor.value);
							}

							if (store === "teams") {
								// This is a bit dangerous, since it will possibly read all teamStats/teamSeasons rows into memory, but that will very rarely exceed MIN_RECORDS_PER_PULL and we will just do one team per transaction, to be safe.

								const tid = cursor.value.tid;

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

								const t: any = cursor.value;

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
								}
							}

							enqueue(
								`${comma}${newline}${tab.repeat(2)}${jsonStringify(
									cursor.value,
									2,
								)}`,
							);
						}

						prevKey = cursor.key as any;

						const desiredSize = (controller as any).desiredSize;
						if ((desiredSize > 0 || size < minSizePerPull) && !cancelCallback) {
							// Keep going if desiredSize or minSizePerPull want us to
							cursor = await cursor.continue();
						} else {
							break;
						}
					}

					// console.log("PULLED", count, size / 1024 / 1024);
					if (!cursor) {
						// Actually done with this store - we didn't just stop due to desiredSize
						if (seenFirstRecord) {
							enqueue(`${newline}${tab}]`);
						}
						done();
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

	const writeRootObject = (name: string, object: any) =>
		writable.write(
			`,${newline}${tab}"${name}":${space}${jsonStringify(object, 1)}`,
		);

	await writable.write("{");
	await writable.write(
		`${newline}${tab}"version":${space}${idb.league.version}`,
	);

	// Row from leagueStore in meta db.
	// phaseText is needed if a phase is set in gameAttributes.
	// name is only used for the file name of the exported roster file.
	if (meta) {
		const leagueName = await getName();
		await writeRootObject("meta", {
			phaseText: local.phaseText,
			name: leagueName,
		});
	}

	for (const store of stores) {
		if (store === "gameAttributes") {
			// gameAttributes is special because we need to convert it into an object

			// Remove cached variables, since they will be auto-generated on re-import but are confusing if someone edits the JSON
			const GAME_ATTRIBUTES_TO_DELETE = ["numActiveTeams", "teamInfoCache"];

			const rows = (
				await getAll(
					idb.league.transaction(store).store,
					undefined,
					filter[store],
				)
			).filter(row => !GAME_ATTRIBUTES_TO_DELETE.includes(row.key));

			await writeRootObject(
				"gameAttributes",
				gameAttributesArrayToObject(rows),
			);
		} else if (store === "teamSeasons" || store === "teamStats") {
			// Handled in "teams"
			continue;
		} else {
			const readable = makeStoreStream(store as any, {
				filter: filter[store],
				forEach:
					store === "players"
						? p => {
								if (p.imgURL) {
									delete (p as any).face;
								}
						  }
						: undefined,
			});
			await readable.pipeTo(writable, {
				preventClose: true,
			});
		}
	}

	if (!stores.includes("gameAttributes")) {
		// Set startingSeason if gameAttributes is not selected, otherwise it's going to fail loading unless startingSeason is coincidentally the same as the default
		await writeRootObject("startingSeason", g.get("startingSeason"));
	}

	await writable.write(`${newline}}${newline}`);

	await writable.close();
};

export default exportLeagueFSA;
