import type { IDBPDatabase } from "idb";
import { connectLeague, idb } from "../../db";
import { getNewLeagueLid } from "../../util";
import remove from "./remove";

const BATCH_SIZE = 1000;

// IDB doesn't play nice with streams, so not worth it to use real streams
const makeDBStream = (db: IDBPDatabase<any>, store: string) => {
	let prevKey: IDBValidKey | undefined;

	return {
		async pull() {
			const range =
				prevKey !== undefined
					? IDBKeyRange.lowerBound(prevKey, true)
					: undefined;

			let batchCount = 0;

			const records = [];
			let done = false;

			let cursor = await db.transaction(store).store.openCursor(range);
			while (cursor) {
				records.push(cursor.value);
				prevKey = cursor.key;
				batchCount += 1;

				if (records.length < BATCH_SIZE) {
					cursor = await cursor.continue();
				} else {
					break;
				}
			}

			console.log(`Done batch of ${batchCount} object`);

			if (!cursor) {
				done = true;
			}

			return {
				done,
				records,
			};
		},
	};
};

export const getCloneName = (nameOld: string, namesOld: string[]) => {
	const matches = nameOld.match(
		/^(?<root>.*?)( \(clone( (?<number>\d+))?\))?$/,
	);

	const root = matches?.groups?.root;
	if (root === undefined) {
		return `${nameOld} (clone)`;
	}

	const numberString = matches?.groups?.number;
	let number = numberString !== undefined ? parseInt(numberString) + 1 : 1;

	while (true) {
		const name = `${root} (clone${number > 1 ? ` ${number}` : ""})`;

		if (namesOld.every(name2 => name !== name2)) {
			return name;
		}

		number += 1;
	}
};

const clone = async (lidOld: number) => {
	let dbOld;
	let dbNew;
	let name = "";

	try {
		dbOld = await connectLeague(lidOld);
		const leagueOld = await idb.meta.get("leagues", lidOld);
		if (!leagueOld) {
			throw new Error("League not found");
		}

		const namesOld = (await idb.meta.getAll("leagues")).map(
			league => league.name,
		);
		name = getCloneName(leagueOld.name, namesOld);

		const lid = await getNewLeagueLid();
		await remove(lid);

		const leagueNew = {
			lid,
			name,
			tid: leagueOld.tid,
			phaseText: leagueOld.phaseText,
			teamName: leagueOld.teamName,
			teamRegion: leagueOld.teamRegion,
			difficulty: leagueOld.difficulty,
			startingSeason: leagueOld.startingSeason,
			season: leagueOld.season,
			imgURL: leagueOld.imgURL,
			created: new Date(),
			lastPlayed: new Date(),
		};
		const lidNew = await idb.meta.add("leagues", leagueNew);
		dbNew = await connectLeague(lidNew);

		for (const store of dbOld.objectStoreNames) {
			console.log("Start", store);
			const dbStream = makeDBStream(dbOld, store);

			while (true) {
				const { done, records } = await dbStream.pull();

				const tx = await dbNew.transaction(store, "readwrite");
				for (const record of records) {
					tx.store.put(record);
				}

				await tx.done;

				if (done) {
					break;
				}
			}

			console.log("Done", store);
		}
	} finally {
		if (dbOld) {
			await dbOld.close();
		}
		if (dbNew) {
			await dbNew.close();
		}
	}

	return name;
};

export default clone;
