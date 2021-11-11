import {
	isSport,
	processPlayerStatsBasketball,
	processPlayerStatsFootball,
	processPlayerStatsHockey,
} from "../../common";
import type { PlayerStats, PlayerStatType } from "../../common/types";
import g from "./g";

const processPlayerStats = (
	ps: PlayerStats,
	stats: string[],
	statType?: PlayerStatType,
	bornYear?: number,
) => {
	if (isSport("football")) {
		return processPlayerStatsFootball(ps, stats, bornYear, () =>
			g.get("fantasyPoints"),
		);
	}

	if (isSport("hockey")) {
		return processPlayerStatsHockey(ps, stats, statType, bornYear);
	}

	return processPlayerStatsBasketball(ps, stats, statType, bornYear);
};

export default processPlayerStats;
