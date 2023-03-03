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
	});

	const leadersCache = {
		age: max(players, p => p.age),
		stats: {} as Record<string, number | undefined>,
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
	const playoffs = false;

	const gamesPlayedCache = new GamesPlayedCache();
	await gamesPlayedCache.loadSeasons([season], playoffs);
	console.log("gamesPlayedCache", gamesPlayedCache);

	for (const stat of stats) {
		leadersCache.stats[stat] = max(
			players.filter(p => {
				const pass = playerMeetsCategoryRequirements({
					career: false,
					cat: {
						stat,
						...requirements[stat],
					},
					gamesPlayedCache,
					p,
					playerStats: p.stats,
					playoffs,
					season,
					statType,
				});

				return pass;
			}),
			p => p.stats[stat],
		);
	}

	console.log("leadersCache", leadersCache);

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
				ratings: Set<string>;
				stats: Set<string>;
		  }
		| undefined
	> = {};
	for (const season of seasons) {
		const p = await idb.getCopy.playersPlus(pRaw, {
			attrs: ["age"],
			// pos is for getLeaderRequirements
			ratings: ["fuzz", "pos", ...ratings],
			// tid is for GamesPlayedCache lookup
			stats: ["tid", ...stats],
			season,
			mergeStats: "totOnly",
			fuzz: true,
		});
		if (!p) {
			// Could be a season where player is a draft prospect or free agent
			continue;
		}

		const leadersCache = await getPlayerStatsLeadersCache(season);

		const leader = {
			attrs: new Set<string>(),
			ratings: new Set<string>(),
			stats: new Set<string>(),
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

		for (const stat of stats) {
			if (p.stats[stat] === leadersCache.stats[stat]) {
				leader.stats.add(stat);
			}
		}

		leaders[season] = leader;
	}

	return leaders;
};

const updatePlayerStatsLeadersCache = async (season: number) => {};

export default updatePlayerStatsLeadersCache;
