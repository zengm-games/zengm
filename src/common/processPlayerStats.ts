import isSport from "./isSport";
import processPlayerStatsBasketball from "./processPlayerStats.basketball";
import processPlayerStatsFootball from "./processPlayerStats.football";
import processPlayerStatsHockey from "./processPlayerStats.hockey";
import type { PlayerStats, PlayerStatType } from "./types";

const processPlayerStats = (
	ps: PlayerStats,
	stats: string[],
	statType?: PlayerStatType,
	bornYear?: number,
) => {
	if (isSport("football")) {
		return processPlayerStatsFootball(ps, stats, statType, bornYear);
	}

	if (isSport("hockey")) {
		return processPlayerStatsHockey(ps, stats, statType, bornYear);
	}

	return processPlayerStatsBasketball(ps, stats, statType, bornYear);
};

export default processPlayerStats;
