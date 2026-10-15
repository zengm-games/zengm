import type { TeamStats } from "../../../common/types.ts";
import { g } from "../../util/index.ts";
import { idb } from "../index.ts";
import { MergedStore, type Query } from "./engine.ts";

export type TeamStatsSelector = { tid: number; season?: number };

class TeamStatsStore extends MergedStore<"teamStats", TeamStatsSelector> {
	protected override toQuery(
		selector: TeamStatsSelector | undefined,
	): Query<TeamStats> | undefined {
		if (selector === undefined) {
			return undefined;
		}

		const { tid, season } = selector;

		if (season !== undefined) {
			// Single team, single season
			//
			// No fromCache using the teamStatsByPlayoffsTid index, because the cache only has the current season, which is just a couple rows per team, so scanning it is cheap. And for a range of compound keys like [[false, tid], [false, tid]], Cache._indexGetAll loops over every index key anyway, so it wouldn't avoid a scan.
			return {
				// The cache has every team stats row from the current season
				fromDb:
					season === g.get("season")
						? undefined
						: () =>
								idb.league
									.transaction("teamStats")
									.store.index("season, tid")
									.getAll([season, tid]),
				matches: (row) => row.tid === tid && row.season === season,
			};
		}

		// Single team, all seasons
		return {
			fromDb: () =>
				idb.league.transaction("teamStats").store.index("tid").getAll(tid),
			matches: (row) => row.tid === tid,
		};
	}
}

export default new TeamStatsStore("teamStats");
