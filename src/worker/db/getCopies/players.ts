import { PLAYER } from "../../../common";
import { getAll, idb } from "..";
import { mergeByPk } from "./helpers";
import { helpers } from "../../util";
import type {
	GetCopyType,
	MinimalPlayerRatings,
	Player,
} from "../../../common/types";
import { unwrap } from "idb";

const getCopies = async (
	{
		pid,
		pids,
		retiredYear,
		activeAndRetired,
		activeSeason,
		draftYear,
		statsTid,
		tid,
		filter = () => true,
	}: {
		pid?: number;
		pids?: number[];
		retiredYear?: number;
		activeAndRetired?: boolean;
		activeSeason?: number;
		draftYear?: number;
		statsTid?: number;
		tid?: [number, number] | number;
		filter?: (p: Player<MinimalPlayerRatings>) => boolean;
	} = {},
	type?: GetCopyType,
): Promise<Player[]> => {
	if (pids?.length === 1) {
		pid = pids[0];
	}

	if (pid !== undefined) {
		const p = await idb.cache.players.get(pid);
		if (p) {
			return [type === "noCopyCache" ? p : helpers.deepCopy(p)];
		}

		const p2 = await idb.league.get("players", pid);
		if (p2) {
			return [p2];
		}

		return [];
	}

	if (pids !== undefined) {
		const sortedPids = [...pids].sort((a, b) => a - b);
		const fromDB = await new Promise<Player<MinimalPlayerRatings>[]>(
			(resolve, reject) => {
				const transaction = idb.league.transaction("players");

				const players: Player<MinimalPlayerRatings>[] = [];

				// Because backboard doesn't support passing an argument to cursor.continue
				const objectStore = unwrap(transaction.objectStore("players"));
				const range = IDBKeyRange.bound(sortedPids[0], sortedPids.at(-1));
				let i = 0;
				const request = objectStore.openCursor(range);

				request.onerror = (e: any) => {
					reject(e.target.error);
				};

				request.onsuccess = (e: any) => {
					const cursor = e.target.result;

					if (!cursor) {
						resolve(players);
						return;
					}

					const p = cursor.value;

					// https://gist.github.com/inexorabletash/704e9688f99ac12dd336
					if (sortedPids.includes(p.pid)) {
						players.push(p);
					}

					i += 1;

					if (i > sortedPids.length) {
						resolve(players);
						return;
					}

					cursor.continue(sortedPids[i]);
				};
			},
		);

		const merged = mergeByPk(
			fromDB,
			(await idb.cache.players.getAll()).filter(p => pids.includes(p.pid)),
			"players",
			type,
		);

		const sorted = [];
		for (const pid of pids) {
			const p = merged.find(p2 => p2.pid === pid);
			if (p) {
				sorted.push(p);
			}
		}

		return sorted;
	}

	if (retiredYear !== undefined) {
		const fromDB = await new Promise<Player<MinimalPlayerRatings>[]>(
			(resolve, reject) => {
				const players: Player<MinimalPlayerRatings>[] = [];

				const index = unwrap(
					idb.league
						.transaction("players")
						.objectStore("players")
						.index("draft.year, retiredYear"),
				);

				const request = index.openCursor();

				request.onerror = (e: any) => {
					reject(e.target.error);
				};

				request.onsuccess = (e: any) => {
					const cursor = e.target.result;

					if (!cursor) {
						resolve(players);
						return;
					}

					const [draftYear, currentRetiredYear] = cursor.key;

					// https://gist.github.com/inexorabletash/704e9688f99ac12dd336
					if (currentRetiredYear < retiredYear) {
						cursor.continue([draftYear, retiredYear]);
					} else if (currentRetiredYear > retiredYear) {
						cursor.continue([draftYear + 1, retiredYear]);
					} else {
						players.push(cursor.value);
						cursor.continue();
					}
				};
			},
		);

		// Get all from cache, and filter later, in case cache differs from database
		return mergeByPk(
			fromDB,
			await idb.cache.players.indexGetAll("playersByTid", PLAYER.RETIRED),
			"players",
			type,
		).filter(p => p.retiredYear === retiredYear);
	}

	if (tid !== undefined) {
		if (Array.isArray(tid)) {
			const [minTid, maxTid] = tid; // Avoid PLAYER.RETIRED, since those aren't in cache

			if (
				minTid === PLAYER.RETIRED ||
				maxTid === PLAYER.RETIRED ||
				(minTid < PLAYER.RETIRED && maxTid > PLAYER.RETIRED)
			) {
				throw new Error("Not implemented");
			}
		}

		// This works if tid is a number or [min, max]
		const fromDB = (
			await idb.cache.players.indexGetAll("playersByTid", tid)
		).filter(filter);
		return type === "noCopyCache" ? fromDB : helpers.deepCopy(fromDB);
	}

	if (activeAndRetired === true) {
		// All except draft prospects
		return mergeByPk(
			[].concat(
				// @ts-ignore
				await getAll(
					idb.league.transaction("players").store.index("tid"),
					PLAYER.RETIRED,
					filter,
				),
				await idb.league
					.transaction("players")
					.store.index("tid")
					.getAll(IDBKeyRange.lowerBound(PLAYER.FREE_AGENT)),
			),
			[].concat(
				// @ts-ignore
				await idb.cache.players.indexGetAll("playersByTid", PLAYER.RETIRED),
				await idb.cache.players.indexGetAll("playersByTid", [
					PLAYER.FREE_AGENT,
					Infinity,
				]),
			),
			"players",
			type,
		).filter(filter);
	}

	if (activeSeason !== undefined) {
		const fromDB = await new Promise<Player<MinimalPlayerRatings>[]>(
			(resolve, reject) => {
				const transaction = idb.league.transaction("players");

				const players: Player<MinimalPlayerRatings>[] = [];

				const index = unwrap(
					transaction.objectStore("players").index("draft.year, retiredYear"),
				);

				// + 1 in upper range is because you don't accumulate stats until the year after the draft
				const range = IDBKeyRange.bound(
					[-Infinity, activeSeason],
					[activeSeason + 1, Infinity],
				);
				const request = index.openCursor(range);

				request.onerror = (e: any) => {
					reject(e.target.error);
				};

				request.onsuccess = (e: any) => {
					const cursor = e.target.result;

					if (!cursor) {
						resolve(players);
						return;
					}

					const [draftYear2, retiredYear] = cursor.key;

					// https://gist.github.com/inexorabletash/704e9688f99ac12dd336
					if (retiredYear < activeSeason) {
						cursor.continue([draftYear2, activeSeason]);
					} else {
						players.push(cursor.value);
						cursor.continue();
					}
				};
			},
		);

		return mergeByPk(
			fromDB,
			([] as Player<MinimalPlayerRatings>[])
				.concat(
					await idb.cache.players.indexGetAll("playersByTid", PLAYER.RETIRED),
					await idb.cache.players.indexGetAll("playersByTid", [
						PLAYER.FREE_AGENT,
						Infinity,
					]),
				)
				.filter(
					p => p.draft.year < activeSeason && p.retiredYear >= activeSeason,
				),
			"players",
			type,
		);
	}

	if (draftYear !== undefined) {
		return mergeByPk(
			await idb.league
				.transaction("players")
				.store.index("draft.year, retiredYear")
				.getAll(
					IDBKeyRange.bound([draftYear, -Infinity], [draftYear, Infinity]),
				),
			(
				await idb.cache.players.indexGetAll("playersByTid", [
					PLAYER.RETIRED,
					Infinity,
				])
			).filter(p => p.draft.year === draftYear),
			"players",
			type,
		);
	}

	const constStatsTid = statsTid;

	if (constStatsTid !== undefined) {
		return mergeByPk(
			await getAll(
				idb.league.transaction("players").store.index("statsTids"),
				constStatsTid,
			),
			([] as Player<MinimalPlayerRatings>[])
				.concat(
					// @ts-ignore
					await idb.cache.players.indexGetAll("playersByTid", PLAYER.RETIRED),
					await idb.cache.players.indexGetAll("playersByTid", [
						PLAYER.FREE_AGENT,
						Infinity,
					]),
				)
				.filter(p => p.statsTids.includes(constStatsTid)),
			"players",
			type,
		);
	}

	return mergeByPk(
		await getAll(idb.league.transaction("players").store, undefined, filter),
		await idb.cache.players.getAll(),
		"players",
		type,
	).filter(filter);
};

export default getCopies;
