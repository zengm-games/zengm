import type { IDBPDatabase } from "@dumbmatter/idb";
import { PLAYER } from "../../../common/constants.ts";
import type { Player } from "../../../common/types.ts";
import { g } from "../../util/index.ts";
import type { LeagueDB } from "../connectLeague.ts";
import { idb } from "../index.ts";
import { emitEach, makeStore, type Exclusive, type Query } from "./engine.ts";

export type PlayersSelector = Exclusive<
	| { pids: readonly number[] }
	// number or [min, max]. Only works for players in the cache, so not retired players.
	| { tid: number | [number, number] }
	| { retiredYear: number }
	// All except draft prospects
	| { activeAndRetired: true }
	// With statsTid, which of activeSeason and statsTid is actually applied depends on which is faster. So it will only return players who played for that team, but some of them might not have been active that season.
	| { activeSeason: number; statsTid?: number }
	| { statsTid: number }
	| { draftYear: number }
	| { hof: true }
	| { note: true }
	| { watch: true }
>;

const emitActiveSeason = async (
	league: IDBPDatabase<LeagueDB>,
	season: number,
	emit: (p: Player) => void,
) => {
	const index = league
		.transaction("players")
		.store.index("draft.year, retiredYear");

	// -1 is because players drafted the year won't play until next year
	const range = IDBKeyRange.bound([-Infinity, season], [season - 1, Infinity]);
	for await (const cursor of index.iterate(range)) {
		const [draftYear, retiredYear] = cursor.key;

		// https://gist.github.com/inexorabletash/704e9688f99ac12dd336
		if (retiredYear < season) {
			cursor.continue([draftYear, season]);
		} else {
			emit(cursor.value);
		}
	}
};

// This reads from IndexedDB only, ignoring the cache. It's exported for exhibition games, which read from some other league.
export const getPlayersActiveSeason = async (
	league: IDBPDatabase<LeagueDB>,
	season: number,
) => {
	const players: Player[] = [];
	await emitActiveSeason(league, season, (p) => {
		players.push(p);
	});
	return players;
};

const emitRetiredYear = async (
	retiredYear: number,
	emit: (p: Player) => void,
) => {
	const index = idb.league
		.transaction("players")
		.store.index("draft.year, retiredYear");
	for await (const cursor of index) {
		const [draftYear, currentRetiredYear] = cursor.key;

		// https://gist.github.com/inexorabletash/704e9688f99ac12dd336
		if (currentRetiredYear < retiredYear) {
			cursor.continue([draftYear, retiredYear]);
		} else if (currentRetiredYear > retiredYear) {
			cursor.continue([draftYear + 1, retiredYear]);
		} else {
			emit(cursor.value);
		}
	}
};

// If statsTid and activeSeason are both defined, which index is faster depends on the number of seasons and teams
const shouldUseActiveSeasonIndex = (statsTid: number | undefined) => {
	if (statsTid === undefined) {
		return true;
	}

	const numTeams = g.get("numTeams");
	const numSeasons = g.get("season") - g.get("startingSeason");

	// Factor is based on testing when this actually gets faster
	return 5 * numTeams <= numSeasons;
};

const toQuery = (selector: PlayersSelector): Query<Player> => {
	if (selector.pids !== undefined) {
		return {
			keys: selector.pids,
		};
	}

	if (selector.tid !== undefined) {
		const tid = selector.tid;

		if (Array.isArray(tid)) {
			const [minTid, maxTid] = tid;

			// Retired players aren't all in the cache
			if (minTid <= PLAYER.RETIRED && maxTid >= PLAYER.RETIRED) {
				throw new Error("Not implemented");
			}
		}

		return {
			fromCache: () => idb.cache.players.indexGetAll("playersByTid", tid),
		};
	}

	if (selector.retiredYear !== undefined) {
		const retiredYear = selector.retiredYear;
		return {
			fromDb: (emit) => emitRetiredYear(retiredYear, emit),
			matches: (p) => p.retiredYear === retiredYear,
		};
	}

	if (selector.activeAndRetired) {
		return {
			// Non-retired players are all in the cache, so only retired players need to be read from IndexedDB
			fromDb: (emit) =>
				emitEach(
					idb.league
						.transaction("players")
						.store.index("tid")
						.iterate(PLAYER.RETIRED),
					emit,
				),
			matches: (p) => p.tid === PLAYER.RETIRED || p.tid >= PLAYER.FREE_AGENT,
		};
	}

	if (selector.activeSeason !== undefined) {
		const { activeSeason, statsTid } = selector;

		if (shouldUseActiveSeasonIndex(statsTid)) {
			return {
				fromDb: (emit) => emitActiveSeason(idb.league, activeSeason, emit),
				matches: (p) =>
					p.draft.year < activeSeason &&
					p.retiredYear >= activeSeason &&
					(statsTid === undefined || p.statsTids.includes(statsTid)),
			};
		}
	}

	if (selector.statsTid !== undefined) {
		const statsTid = selector.statsTid;
		return {
			fromDb: (emit) =>
				emitEach(
					idb.league
						.transaction("players")
						.store.index("statsTids")
						.iterate(statsTid),
					emit,
				),
			matches: (p) => p.statsTids.includes(statsTid),
		};
	}

	if (selector.draftYear !== undefined) {
		const draftYear = selector.draftYear;
		return {
			fromDb: (emit) =>
				emitEach(
					idb.league
						.transaction("players")
						.store.index("draft.year, retiredYear")
						.iterate(
							IDBKeyRange.bound([draftYear, -Infinity], [draftYear, Infinity]),
						),
					emit,
				),
			matches: (p) => p.draft.year === draftYear,
		};
	}

	if (selector.hof) {
		return {
			fromDb: (emit) =>
				emitEach(
					idb.league.transaction("players").store.index("hof").iterate(1),
					emit,
				),
			matches: (p) => p.hof === 1,
		};
	}

	if (selector.note) {
		return {
			// undefined for key returns all of the players with noteBool, since the ones without noteBool are not included in this index
			fromDb: (emit) =>
				emitEach(
					idb.league.transaction("players").store.index("noteBool").iterate(),
					emit,
				),
			matches: (p) => p.noteBool === 1,
		};
	}

	if (selector.watch) {
		return {
			// undefined for key returns all of the players with watch, since the ones without watch are not included in this index
			fromDb: (emit) =>
				emitEach(
					idb.league.transaction("players").store.index("watch").iterate(),
					emit,
				),
			matches: (p) => p.watch !== undefined,
		};
	}

	throw new Error("Invalid selector");
};

export default makeStore("players", toQuery);
