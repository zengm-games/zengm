import { PHASE, RATINGS } from "../../../common";
import type { Player } from "../../../common/types";
import { idb } from "../../db";
import { g } from "../../util";
import { getPlayerProfileStats } from "../../views/player";
import player from ".";
import getSeasonLeaders, {
	splitRegularSeasonPlayoffsCombined,
} from "../season/getSeasonLeaders";

// Return the attrs/ratings/stats this player is the leader in, by season
const getLeaders = async (pRaw: Player) => {
	const seasons = new Set<number>();
	for (const row of [...pRaw.stats, ...pRaw.ratings]) {
		seasons.add(row.season);
	}

	const currentSeason = g.get("season");
	const currentPhase = g.get("phase");

	const stats = getPlayerProfileStats();
	const ratings = ["ovr", "pot", ...RATINGS];

	const leaders: Record<
		string,
		| {
				attrs: Set<string>;
				regularSeason: Set<string>;
				playoffs: Set<string>;
				combined: Set<string>;
				ratings: Set<string>;
		  }
		| undefined
	> = {};
	for (const season of seasons) {
		const regularSeasonOnly =
			season === currentSeason && currentPhase < PHASE.PLAYOFFS;

		const p = await idb.getCopy.playersPlus(pRaw, {
			attrs: ["age"],
			// pos is for getLeaderRequirements
			ratings: ["pos", ...ratings],
			// tid is for GamesPlayedCache lookup
			stats: ["tid", ...stats],
			season,
			mergeStats: "totOnly",
			fuzz: true,
			playoffs: true, // Always true, or it tries to return an object for stats rather than array
			combined: !regularSeasonOnly,
		});
		if (!p) {
			// Could be a season where player is a draft prospect or free agent
			continue;
		}
		splitRegularSeasonPlayoffsCombined(p);

		const leadersCache = await getSeasonLeaders(season);
		if (!leadersCache) {
			continue;
		}

		const leader = {
			attrs: new Set<string>(),
			regularSeason: new Set<string>(),
			playoffs: new Set<string>(),
			combined: new Set<string>(),
			ratings: new Set<string>(),
		};

		// Oldest player must have been on a team this season
		if ((p.regularSeason || p.playoffs) && p.age === leadersCache.age) {
			leader.attrs.add("age");
		}

		const ratingsCache =
			leadersCache[g.get("godMode") ? "ratings" : "ratingsFuzz"];
		if (ratingsCache) {
			for (const rating of ratings) {
				if (p.ratings[rating] === ratingsCache[rating]) {
					leader.ratings.add(rating);
				}
			}
		}

		for (const type of ["regularSeason", "playoffs", "combined"] as const) {
			const leadersCacheType = leadersCache[type];
			if (leadersCacheType && p[type]) {
				for (const stat of stats) {
					let value;
					if (player.stats.max.includes(stat) && p[type][stat]) {
						value = p[type][stat][0];
					} else {
						value = p[type][stat];
					}

					if (value === leadersCacheType[stat]) {
						leader[type].add(stat);
					}
				}
			}
		}

		if (regularSeasonOnly) {
			// Combined and regular season leaders are the same, but until the playoffs start, seasonLeaders is not calculated for combined stats
			leader.combined = leader.regularSeason;
		}

		leaders[season] = leader;
	}

	return leaders;
};

export default getLeaders;
