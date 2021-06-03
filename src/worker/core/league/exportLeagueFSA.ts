import type { StoreNames } from "idb";
import { gameAttributesArrayToObject } from "../../../common";
import { getAll, idb } from "../../db";
import type { LeagueDB } from "../../db/connectLeague";
import { g, local } from "../../util";
import getName from "./getName";

// Otherwise it often pulls just one record per transaction
const MIN_RECORDS_PER_PULL = 10000;

const NUM_SPACES_IN_TAB = 2;

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
		}: {
			filter?: Filter;
		},
	) => {
		let prevKey: LeagueDB[Store]["key"] | undefined;
		let cancelCallback: (() => void) | undefined;
		let seenFirstRecord = false;

		return new ReadableStream(
			{
				start(controller) {
					console.log("start", store);
					controller.enqueue(`,${newline}${tab}"${store}": [`);
				},
				async pull(controller) {
					console.log("PULL", prevKey, controller.desiredSize);
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

					let count = 0;

					const range =
						prevKey !== undefined
							? IDBKeyRange.lowerBound(prevKey, true)
							: undefined;
					let cursor = await idb.league
						.transaction(store)
						.store.openCursor(range);
					while (cursor) {
						if (!filter || filter(cursor.value)) {
							count += 1;

							const comma = seenFirstRecord ? "," : "";
							controller.enqueue(
								`${comma}${newline}${tab.repeat(2)}${jsonStringify(
									cursor.value,
									2,
								)}`,
							);
							if (!seenFirstRecord) {
								seenFirstRecord = true;
							}
						}

						prevKey = cursor.key as any;

						if (
							((controller as any).desiredSize > 0 ||
								count < MIN_RECORDS_PER_PULL) &&
							!cancelCallback
						) {
							cursor = await cursor.continue();
						} else {
							break;
						}
					}

					console.log("PULLED", count);
					if (!cursor) {
						controller.enqueue(`${newline}${tab}]`);
						// Actually done with this store - we didn't just stop due to desiredSize
						done();
						console.log("done", store);
					}
				},
				cancel() {
					return new Promise(resolve => {
						cancelCallback = resolve;
					});
				},
			},
			{
				highWaterMark: MIN_RECORDS_PER_PULL,
			},
		);
	};

	await writable.write("{");
	await writable.write(
		`${newline}${tab}"version":${space}${idb.league.version}`,
	);

	// Row from leagueStore in meta db.
	// phaseText is needed if a phase is set in gameAttributes.
	// name is only used for the file name of the exported roster file.
	if (meta) {
		const leagueName = await getName();
		await writable.write(
			`,${newline}${tab}"meta":${space}${jsonStringify(
				{
					phaseText: local.phaseText,
					name: leagueName,
				},
				1,
			)}`,
		);
	}

	for (const store of stores) {
		console.log("before", store);
		const readable = makeStoreStream(store as any, {
			filter: filter[store],
		});
		await readable.pipeTo(writable, {
			preventClose: true,
		});
		console.log("after", store);
	}

	await writable.write("\n}\n");

	await writable.close();

	/*
	await Promise.all(
		stores.map(async store => {
			exportedLeague[store] = await getAll(
				idb.league.transaction(store as any).store,
				undefined,
				filter[store],
			);
		}),
	);

	if (stores.includes("players")) {
		// Don't export cartoon face if imgURL is provided
		exportedLeague.players = exportedLeague.players.map((p: any) => {
			if (p.imgURL && p.imgURL !== "") {
				const p2 = { ...p };
				delete p2.face;
				return p2;
			}

			return p;
		});
	}

	if (stores.includes("teams")) {
		for (let i = 0; i < exportedLeague.teamSeasons.length; i++) {
			const tid = exportedLeague.teamSeasons[i].tid;

			for (let j = 0; j < exportedLeague.teams.length; j++) {
				if (exportedLeague.teams[j].tid === tid) {
					if (!exportedLeague.teams[j].hasOwnProperty("seasons")) {
						exportedLeague.teams[j].seasons = [];
					}

					exportedLeague.teams[j].seasons.push(exportedLeague.teamSeasons[i]);
					break;
				}
			}
		}

		for (let i = 0; i < exportedLeague.teamStats.length; i++) {
			const tid = exportedLeague.teamStats[i].tid;

			for (let j = 0; j < exportedLeague.teams.length; j++) {
				if (exportedLeague.teams[j].tid === tid) {
					if (!exportedLeague.teams[j].hasOwnProperty("stats")) {
						exportedLeague.teams[j].stats = [];
					}

					exportedLeague.teams[j].stats.push(exportedLeague.teamStats[i]);
					break;
				}
			}
		}

		delete exportedLeague.teamSeasons;
		delete exportedLeague.teamStats;
	}

	if (stores.includes("gameAttributes")) {
		// Remove cached variables, since they will be auto-generated on re-import but are confusing if someone edits the JSON
		const keysToDelete = ["numActiveTeams", "teamInfoCache"];
		const gaArray = exportedLeague.gameAttributes
			.filter((gameAttribute: any) => !keysToDelete.includes(gameAttribute.key))
			.filter(
				// No point in exporting undefined
				(gameAttribute: any) => gameAttribute.value !== undefined,
			);

		exportedLeague.gameAttributes = gameAttributesArrayToObject(gaArray);
	} else {
		// Set startingSeason if gameAttributes is not selected, otherwise it's going to fail loading unless startingSeason is coincidentally the same as the default
		exportedLeague.startingSeason = g.get("startingSeason");
	}

	// No need emitting empty object stores
	for (const key of Object.keys(exportedLeague)) {
		if (
			Array.isArray(exportedLeague[key]) &&
			exportedLeague[key].length === 0
		) {
			delete exportedLeague[key];
		}
	}*/
};

export default exportLeagueFSA;
