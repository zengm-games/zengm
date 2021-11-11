import {
	isSport,
	processPlayerStatsBasketball,
	processPlayerStatsFootball,
	processPlayerStatsHockey,
} from "../../common";
import type { PlayerStats, PlayerStatType } from "../../common/types";
import { local } from "./local";

const processPlayerStats = (
	ps: PlayerStats,
	stats: string[],
	statType?: PlayerStatType,
	bornYear?: number,
) => {
	if (isSport("football")) {
		return processPlayerStatsFootball(ps, stats, bornYear, () => {
			return local.getState().fantasyPoints;
		});
	}

	if (isSport("hockey")) {
		return processPlayerStatsHockey(ps, stats, statType, bornYear);
	}

	return processPlayerStatsBasketball(ps, stats, statType, bornYear);
};

export default processPlayerStats;
