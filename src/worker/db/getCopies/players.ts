import { PLAYER } from "../../../common/index.ts";
import { getAll, idb } from "../index.ts";
import { mergeByPk } from "./helpers.ts";
import { g, helpers } from "../../util/index.ts";
import type {
	GetCopyType,
	MinimalPlayerRatings,
	Player,
} from "../../../common/types.ts";
import { type IDBPDatabase, unwrap } from "@dumbmatter/idb";
import type { LeagueDB } from "../connectLeague.ts";

export const getPlayersActiveSeason = (
	league: IDBPDatabase<LeagueDB>,
	season: number,
) => {
	return new Promise<Player<MinimalPlayerRatings>[]>((resolve, reject) => {
		const transaction = league.transaction("players");

		const players: Player<MinimalPlayerRatings>[] = [];

		const index = unwrap(
			transaction.objectStore("players").index("draft.year, retiredYear"),
		);

		// -1 is because players drafted last year won't play until this year
		const range = IDBKeyRange.bound(
			[-Infinity, season - 1],
			[season, Infinity],
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
			if (retiredYear < season) {
				cursor.continue([draftYear2, season]);
			} else {
				players.push(cursor.value);
				cursor.continue();
			}
		};
	});
};

const getCopies = async (
	{
		pid,
		pids,
		retiredYear,
		activeAndRetired,
		activeSeason,
		draftYear,
		hof,
		note,
		statsTid,
		tid,
		watch,
		filter = () => true,
	}: {
		pid?: number;
		pids?: number[];
		retiredYear?: number;
		activeAndRetired?: boolean;
		activeSeason?: number;
		draftYear?: number;
		hof?: boolean;
		note?: boolean;
		statsTid?: number;
		tid?: [number, number] | number;
		watch?: boolean;
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
		if (pids.length === 0) {
			return [];
		}

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
			(await idb.cache.players.getAll()).filter((p) => pids.includes(p.pid)),
			"players",
			type,
		);

		const sorted = [];
		for (const pid of pids) {
			const p = merged.find((p2) => p2.pid === pid);
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
		).filter((p) => p.retiredYear === retiredYear);
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
				// @ts-expect-error
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
				// @ts-expect-error
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
		let proceed = true;
		if (statsTid !== undefined) {
			// If statsTid and activeSeason are both defined, use activeSeason rather thatn statsTid based on number of seasons/teams
			const numTeams = g.get("numTeams");
			const numSeasons = g.get("season") - g.get("startingSeason");

			// Factor is based on testing when this actually gets faster
			if (5 * numTeams > numSeasons) {
				proceed = false;
			}
		}

		if (proceed) {
			const fromDB = await getPlayersActiveSeason(idb.league, activeSeason);

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
						(p) =>
							p.draft.year < activeSeason &&
							p.retiredYear >= activeSeason &&
							(statsTid === undefined || p.statsTids.includes(statsTid)),
					),
				"players",
				type,
			);
		}
	}

	if (hof) {
		return mergeByPk(
			await getAll(
				idb.league.transaction("players").store.index("hof"),
				1,
				filter,
			),
			(await idb.cache.players.getAll()).filter((p) => p.hof === 1),
			"players",
			type,
		).filter(filter);
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
			).filter((p) => p.draft.year === draftYear),
			"players",
			type,
		);
	}

	if (statsTid !== undefined) {
		return mergeByPk(
			await getAll(
				idb.league.transaction("players").store.index("statsTids"),
				statsTid,
			),
			([] as Player<MinimalPlayerRatings>[])
				.concat(
					await idb.cache.players.indexGetAll("playersByTid", PLAYER.RETIRED),
					await idb.cache.players.indexGetAll("playersByTid", [
						PLAYER.FREE_AGENT,
						Infinity,
					]),
				)
				.filter((p) => p.statsTids.includes(statsTid)),
			"players",
			type,
		);
	}

	if (note) {
		return mergeByPk(
			// undefined for key returns all of the players with noteBool, since the ones without noteBool are not included in this index
			await getAll(
				idb.league.transaction("players").store.index("noteBool"),
				undefined,
				filter,
			),
			await idb.cache.players.getAll(),
			"players",
			type,
		).filter((p) => p.noteBool === 1 && filter(p));
	}

	if (watch) {
		return mergeByPk(
			// undefined for key returns all of the players with values, since the ones with without watch are not included in this index
			await getAll(
				idb.league.transaction("players").store.index("watch"),
				undefined,
				filter,
			),
			await idb.cache.players.getAll(),
			"players",
			type,
		).filter((p) => p.watch !== undefined && filter(p));
	}

	return mergeByPk(
		await getAll(idb.league.transaction("players").store, undefined, filter),
		await idb.cache.players.getAll(),
		"players",
		type,
	).filter(filter);
};

export default getCopies;
