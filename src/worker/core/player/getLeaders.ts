import { bySport, PHASE, PLAYER, RATINGS } from "../../../common";
import type {
	SeasonLeaders,
	Player,
	PlayerStatType,
} from "../../../common/types";
import { idb } from "../../db";
import { g, local } from "../../util";
import {
	GamesPlayedCache,
	playerMeetsCategoryRequirements,
} from "../../views/leaders";
import { getPlayerProfileStats } from "../../views/player";
import player from ".";
import getLeaderRequirements from "../season/getLeaderRequirements";
import { NUM_SEASON_LEADERS_CACHE } from "../../db/Cache";

const max = (
	rows: any[],
	getValue: (row: any) => number,
	statInfo?: ReturnType<typeof getLeaderRequirements>["string"],
) => {
	let current:
		| {
				sortValue: number;
				value: any;
		  }
		| undefined;
	for (const row of rows) {
		const value = getValue(row);
		const sortValue = statInfo?.sortValue ? statInfo.sortValue(value) : value;
		if (
			current === undefined ||
			(statInfo?.sortAscending
				? sortValue < current.sortValue
				: sortValue > current.sortValue)
		) {
			current = {
				sortValue,
				value,
			};
		}
	}
	return current?.value;
};

const splitRegularSeasonPlayoffs = (p: any) => {
	for (const row of p.stats) {
		if (row.playoffs) {
			p.playoffs = row;
		} else {
			p.regularSeason = row;
		}
	}
};

const getSeasonLeaders = async (season: number) => {
	const currentSeason = g.get("season");
	const seasonInProgress =
		season > currentSeason ||
		(season === currentSeason && g.get("phase") <= PHASE.PLAYOFFS);
	if (seasonInProgress) {
		if (local.seasonLeaders) {
			return local.seasonLeaders;
		}
	} else {
		const leadersCache =
			(await idb.cache.seasonLeaders.get(season)) ??
			(await idb.league.get("seasonLeaders", season));
		if (leadersCache) {
			return leadersCache;
		}

		if (season < g.get("startingSeason")) {
			// Ignore any partial data from historical seasons before this league existed, unless it's already cached (like from initializing real players league)
			return;
		}
	}

	// If seasonInProgress, do it the fast way (ignore player deaths or whatever), because this is just transient
	let playersRaw;
	if (seasonInProgress) {
		playersRaw = await idb.cache.players.indexGetAll("playersByTid", [
			PLAYER.FREE_AGENT,
			Infinity,
		]);
	} else {
		playersRaw = await idb.getCopies.players(
			{
				activeSeason: season,
			},
			"noCopyCache",
		);
	}

	const stats = getPlayerProfileStats();
	const ratings = ["ovr", "pot", ...RATINGS];

	const players = await idb.getCopies.playersPlus(playersRaw, {
		attrs: ["age"],
		// pos is for getLeaderRequirements
		ratings: ["fuzz", "pos", ...ratings],
		// tid is for GamesPlayedCache lookup
		stats: ["tid", ...stats],
		season,
		mergeStats: "totOnly",
		playoffs: true,
	});
	for (const p of players) {
		splitRegularSeasonPlayoffs(p);
	}

	const leadersCache: SeasonLeaders = {
		season,
		age: max(players, p => p.age),
		regularSeason: {},
		playoffs: {},
		ratings: {},
		ratingsFuzz: {},
	};

	for (const rating of ["ovr", "pot", ...RATINGS]) {
		leadersCache.ratings[rating] = max(players, p => p.ratings[rating]);
		leadersCache.ratingsFuzz[rating] = max(players, p =>
			player.fuzzRating(p.ratings[rating], p.ratings.fuzz, true),
		);
	}

	const requirements = getLeaderRequirements();
	const statType: PlayerStatType = bySport({
		baseball: "totals",
		basketball: "perGame",
		football: "totals",
		hockey: "totals",
	});

	for (const type of ["regularSeason", "playoffs"] as const) {
		const playoffs = type === "playoffs";

		const gamesPlayedCache = new GamesPlayedCache();
		await gamesPlayedCache.loadSeasons([season], playoffs);

		for (const stat of stats) {
			if (type === "regularSeason" && !requirements[stat]) {
				throw new Error(`Missing leader requirements for ${stat}`);
			}

			const statInfo = {
				stat,
				...requirements[stat],
			};

			leadersCache[type][stat] = max(
				players.filter(p => {
					const playerStats = p[type];
					if (!playerStats) {
						// Maybe no playoff stats
						return false;
					}

					// Ignore byPos fielding stats, too annoying to compute
					if (
						Array.isArray(playerStats[stat]) &&
						!player.stats.max.includes(stat)
					) {
						return false;
					}

					const pass = playerMeetsCategoryRequirements({
						career: false,
						cat: statInfo,
						gamesPlayedCache,
						p,
						playerStats,
						playoffs,
						season,
						statType,
					});

					return pass;
				}),
				p => {
					const value = p[type][stat];
					if (player.stats.max.includes(stat) && value) {
						return value[0];
					}

					return value;
				},
				statInfo,
			);
		}
	}

	if (seasonInProgress) {
		// Cache until next game sim
		local.seasonLeaders = leadersCache;
	} else {
		// put rather than add in case two players are opened at once
		if (g.get("season") - NUM_SEASON_LEADERS_CACHE <= leadersCache.season) {
			// Add to cache when appropriate
			await idb.cache.seasonLeaders.put(leadersCache);
		} else {
			await idb.league.put("seasonLeaders", leadersCache);
		}
	}

	return leadersCache;
};

// Return the attrs/ratings/stats this player is the leader in, by season
const getLeaders = async (pRaw: Player) => {
	const seasons = new Set<number>();
	for (const row of [...pRaw.stats, ...pRaw.ratings]) {
		seasons.add(row.season);
	}

	const stats = getPlayerProfileStats();
	const ratings = ["ovr", "pot", ...RATINGS];

	const leaders: Record<
		string,
		| {
				attrs: Set<string>;
				regularSeason: Set<string>;
				playoffs: Set<string>;
				ratings: Set<string>;
		  }
		| undefined
	> = {};
	for (const season of seasons) {
		const p = await idb.getCopy.playersPlus(pRaw, {
			attrs: ["age"],
			// pos is for getLeaderRequirements
			ratings: ["pos", ...ratings],
			// tid is for GamesPlayedCache lookup
			stats: ["tid", ...stats],
			season,
			mergeStats: "totOnly",
			fuzz: true,
			playoffs: true,
		});
		if (!p) {
			// Could be a season where player is a draft prospect or free agent
			continue;
		}
		splitRegularSeasonPlayoffs(p);

		const leadersCache = await getSeasonLeaders(season);
		if (!leadersCache) {
			continue;
		}

		const leader = {
			attrs: new Set<string>(),
			regularSeason: new Set<string>(),
			playoffs: new Set<string>(),
			ratings: new Set<string>(),
		};

		// Oldest player must have been on a team this season
		if ((p.regularSeason || p.playoffs) && p.age === leadersCache.age) {
			leader.attrs.add("age");
		}

		for (const rating of ratings) {
			if (
				p.ratings[rating] ===
				leadersCache[g.get("godMode") ? "ratings" : "ratingsFuzz"][rating]
			) {
				leader.ratings.add(rating);
			}
		}

		for (const type of ["regularSeason", "playoffs"] as const) {
			if (p[type]) {
				for (const stat of stats) {
					let value;
					if (player.stats.max.includes(stat) && p[type][stat]) {
						value = p[type][stat][0];
					} else {
						value = p[type][stat];
					}

					if (value === leadersCache[type][stat]) {
						leader[type].add(stat);
					}
				}
			}
		}

		leaders[season] = leader;
	}

	return leaders;
};

export default getLeaders;
