import type { TeamSeason } from "../../../common/types.ts";
import { g } from "../../util/index.ts";
import { NUM_PRIOR_SEASONS_TEAM_SEASONS } from "../Cache.ts";
import { idb } from "../index.ts";
import { MergedStore, type Exclusive, type Query } from "./engine.ts";

export type TeamSeasonsSelector = Exclusive<
	// seasons is [min, max]
	| { tid: number; season?: number; seasons?: Readonly<[number, number]> }
	| { season: number }
	| { note: true }
>;

// If true, all team seasons for this season are in the cache, so there is no need to read from IndexedDB
const isSeasonInCache = (season: number) => {
	return season >= g.get("season") - NUM_PRIOR_SEASONS_TEAM_SEASONS;
};

class TeamSeasonsStore extends MergedStore<"teamSeasons", TeamSeasonsSelector> {
	protected override toQuery(
		selector: TeamSeasonsSelector | undefined,
	): Query<TeamSeason> | undefined {
		if (selector === undefined) {
			return undefined;
		}

		if (selector.note) {
			return {
				// undefined for key returns all of the team seasons with noteBool, since the ones without noteBool are not included in this index
				fromDb: () =>
					idb.league
						.transaction("teamSeasons")
						.store.index("noteBool")
						.iterate(),
				matches: (ts) => ts.noteBool === 1,
			};
		}

		if (selector.tid === undefined) {
			// All teams, single season
			const season = selector.season;
			return {
				fromDb: isSeasonInCache(season)
					? undefined
					: () =>
							idb.league
								.transaction("teamSeasons")
								.store.index("season, tid")
								.iterate(IDBKeyRange.bound([season], [season, ""])),
				fromCache: () =>
					idb.cache.teamSeasons.indexGetAll("teamSeasonsBySeasonTid", [
						[season],
						[season, "Z"],
					]),
				matches: (ts) => ts.season === season,
			};
		}

		const { tid, season, seasons } = selector;

		if (season !== undefined) {
			// Single team, single season
			return {
				fromDb: isSeasonInCache(season)
					? undefined
					: () =>
							idb.league
								.transaction("teamSeasons")
								.store.index("season, tid")
								.iterate([season, tid]),
				fromCache: () =>
					idb.cache.teamSeasons.indexGetAll("teamSeasonsBySeasonTid", [
						[season, tid],
						[season, tid],
					]),
				matches: (ts) => ts.tid === tid && ts.season === season,
			};
		}

		if (seasons !== undefined) {
			// Single team, range of seasons
			const [minSeason, maxSeason] = seasons;
			return {
				fromDb: () =>
					idb.league
						.transaction("teamSeasons")
						.store.index("tid, season")
						.iterate(IDBKeyRange.bound([tid, minSeason], [tid, maxSeason])),
				fromCache: () =>
					idb.cache.teamSeasons.indexGetAll("teamSeasonsByTidSeason", [
						[tid, minSeason],
						[tid, maxSeason],
					]),
				matches: (ts) =>
					ts.tid === tid && ts.season >= minSeason && ts.season <= maxSeason,
			};
		}

		// Single team, all seasons
		return {
			fromDb: () =>
				idb.league
					.transaction("teamSeasons")
					.store.index("tid, season")
					.iterate(IDBKeyRange.bound([tid], [tid, ""])),
			fromCache: () =>
				idb.cache.teamSeasons.indexGetAll("teamSeasonsByTidSeason", [
					[tid],
					[tid, "Z"],
				]),
			matches: (ts) => ts.tid === tid,
		};
	}

	// There is at most one team season for a tid and season
	async getByTidSeason(tid: number, season: number) {
		const rows = await this.getAll({ tid, season });
		return rows[0];
	}
}

export default new TeamSeasonsStore("teamSeasons");
