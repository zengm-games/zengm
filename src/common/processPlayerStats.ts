import processPlayerStatsBasketball from "./processPlayerStats.basketball";
import processPlayerStatsFootball from "./processPlayerStats.football";
import type { PlayerStats, PlayerStatType } from "./types";

const processPlayerStats = (
	ps: PlayerStats,
	stats: string[],
	statType?: PlayerStatType,
	bornYear?: number,
) => {
	if (process.env.SPORT === "football") {
		return processPlayerStatsFootball(ps, stats, statType, bornYear);
	}

	if (statType === undefined || bornYear === undefined) {
		throw new Error("statType and bornYear are required");
	}

	return processPlayerStatsBasketball(ps, stats, statType, bornYear);
};

export default processPlayerStats;
