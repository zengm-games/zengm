import { bySport, RATINGS } from "../../../common";
import type { Player, PlayerStatType } from "../../../common/types";
import { idb } from "../../db";
import { g } from "../../util";
import {
	GamesPlayedCache,
	playerMeetsCategoryRequirements,
} from "../../views/leaders";
import { getPlayerProfileStats } from "../../views/player";
import player from "../player";
import getLeaderRequirements from "./getLeaderRequirements";

const max = (rows: any[], getValue: (row: any) => number) => {
	let current: number | undefined;
	for (const row of rows) {
		const value = getValue(row);
		if (current === undefined || value > current) {
			current = value;
		}
	}
	return current;
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

const getPlayerStatsLeadersCache = async (season: number) => {
	const playersRaw = await idb.getCopies.players(
		{
			activeSeason: season,
		},
		"noCopyCache",
	);

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

	const leadersCache = {
		age: max(players, p => p.age),
		regularSeason: {} as Record<string, number | undefined>,
		playoffs: {} as Record<string, number | undefined>,
		ratings: {} as Record<string, number | undefined>,
		ratingsFuzz: {} as Record<string, number | undefined>,
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
			leadersCache[type][stat] = max(
				players.filter(p => {
					const playerStats = p[type];
					if (!playerStats) {
						// Maybe no playoff stats
						return false;
					}

					const pass = playerMeetsCategoryRequirements({
						career: false,
						cat: {
							stat,
							...requirements[stat],
						},
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
			);
		}
	}

	console.log("leadersCache", season, leadersCache);

	return leadersCache;
};

export const getPlayerLeaders = async (pRaw: Player) => {
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

		const leadersCache = await getPlayerStatsLeadersCache(season);

		const leader = {
			attrs: new Set<string>(),
			regularSeason: new Set<string>(),
			playoffs: new Set<string>(),
			ratings: new Set<string>(),
		};

		if (p.age === leadersCache.age) {
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
					console.log(type, stat, value, leadersCache[type][stat]);

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

const updatePlayerStatsLeadersCache = async (season: number) => {};

export default updatePlayerStatsLeadersCache;
