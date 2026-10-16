import type { IDBPDatabase } from "@dumbmatter/idb";
import { PHASE, PLAYER } from "../../../common/constants.ts";
import type { Player } from "../../../common/types.ts";
import { g } from "../../util/index.ts";
import type { LeagueDB } from "../connectLeague.ts";
import { idb } from "../index.ts";
import { MergedStore, type Exclusive, type Query } from "./engine.ts";

export type PlayersSelector = Exclusive<
	| { pids: readonly number[] }
	// number or [min, max]. Only works for players in the cache, so not retired players.
	| { tid: number | [number, number] }
	| { retiredYear: number }
	// All except draft prospects
	| { activeAndRetired: true }
	// Everyone in the cache except retired players, which includes draft prospects
	| { nonRetired: true }
	// With statsTid, which of activeSeason and statsTid is actually applied depends on which is faster. So it will only return players who played for that team, but some of them might not have been active that season.
	| { activeSeason: number; statsTid?: number }
	| { statsTid: number }
	| { draftYear: number }
	| { hof: true }
	| { note: true }
	| { watch: true }
>;

// Players who were active in a season. For the current season during the regular season or playoffs, this reads non-retired players from the cache, which is faster than the activeSeason selector but misses anyone who retired during the season (like from a tragic death) and is no longer in the cache.
export const getActiveSeasonSelector = (season: number): PlayersSelector => {
	if (g.get("season") === season && g.get("phase") <= PHASE.PLAYOFFS) {
		return { tid: [PLAYER.FREE_AGENT, Infinity] };
	}

	return { activeSeason: season };
};

async function* activeSeasonFromDb(
	league: IDBPDatabase<LeagueDB>,
	season: number,
) {
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
			yield cursor;
		}
	}
}

// This reads from IndexedDB only, ignoring the cache. It's exported for exhibition games, which read from some other league.
export const getPlayersActiveSeason = async (
	league: IDBPDatabase<LeagueDB>,
	season: number,
) => {
	const players: Player[] = [];
	for await (const { value } of activeSeasonFromDb(league, season)) {
		players.push(value);
	}
	return players;
};

async function* retiredYearFromDb(retiredYear: number) {
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
			yield cursor;
		}
	}
}

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

class PlayersStore extends MergedStore<"players", PlayersSelector> {
	protected override toQuery(
		selector: PlayersSelector | undefined,
	): Query<Player> | undefined {
		if (selector === undefined) {
			return undefined;
		}

		if (selector.pids !== undefined) {
			return {
				keys: selector.pids,
			};
		}

		if (selector.tid !== undefined) {
			const tid = selector.tid;

			// Retired players aren't all in the cache
			if (Array.isArray(tid)) {
				const [minTid, maxTid] = tid;
				if (minTid <= PLAYER.RETIRED && maxTid >= PLAYER.RETIRED) {
					throw new Error("Not implemented");
				}
			} else if (tid === PLAYER.RETIRED) {
				throw new Error("Not implemented");
			}

			return {
				fromCache: () => idb.cache.players.indexGetAll("playersByTid", tid),
			};
		}

		if (selector.retiredYear !== undefined) {
			const retiredYear = selector.retiredYear;
			return {
				fromDb: () => retiredYearFromDb(retiredYear),
				matches: (p) => p.retiredYear === retiredYear,
			};
		}

		if (selector.activeAndRetired) {
			return {
				// Non-retired players are all in the cache, so only retired players need to be read from IndexedDB
				fromDb: () =>
					idb.league
						.transaction("players")
						.store.index("tid")
						.iterate(PLAYER.RETIRED),
				matches: (p) => p.tid === PLAYER.RETIRED || p.tid >= PLAYER.FREE_AGENT,
			};
		}

		if (selector.nonRetired) {
			return {
				// Non-retired players are all in the cache, so there's no need to read from IndexedDB. Retired players can be in the cache too, like from a tragic death or an edited player this session.
				fromDb: undefined,
				matches: (p) => p.tid !== PLAYER.RETIRED,
			};
		}

		if (selector.activeSeason !== undefined) {
			const { activeSeason, statsTid } = selector;

			if (shouldUseActiveSeasonIndex(statsTid)) {
				return {
					fromDb: () => activeSeasonFromDb(idb.league, activeSeason),
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
				fromDb: () =>
					idb.league
						.transaction("players")
						.store.index("statsTids")
						.iterate(statsTid),
				matches: (p) => p.statsTids.includes(statsTid),
			};
		}

		if (selector.draftYear !== undefined) {
			const draftYear = selector.draftYear;
			return {
				fromDb: () =>
					idb.league
						.transaction("players")
						.store.index("draft.year, retiredYear")
						.iterate(
							IDBKeyRange.bound([draftYear, -Infinity], [draftYear, Infinity]),
						),
				matches: (p) => p.draft.year === draftYear,
			};
		}

		if (selector.hof) {
			return {
				fromDb: () =>
					idb.league.transaction("players").store.index("hof").iterate(1),
				matches: (p) => p.hof === 1,
			};
		}

		if (selector.note) {
			return {
				// undefined for key returns all of the players with noteBool, since the ones without noteBool are not included in this index
				fromDb: () =>
					idb.league.transaction("players").store.index("noteBool").iterate(),
				matches: (p) => p.noteBool === 1,
			};
		}

		if (selector.watch) {
			return {
				// undefined for key returns all of the players with watch, since the ones without watch are not included in this index
				fromDb: () =>
					idb.league.transaction("players").store.index("watch").iterate(),
				matches: (p) => p.watch !== undefined,
			};
		}

		throw new Error("Invalid selector");
	}
}

export default new PlayersStore("players");
