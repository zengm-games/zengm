import {
	bySport,
	processPlayerStatsBaseball,
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
	return bySport({
		baseball: processPlayerStatsBaseball(ps, stats, statType, bornYear),
		basketball: processPlayerStatsBasketball(ps, stats, statType, bornYear),
		football: processPlayerStatsFootball(ps, stats, bornYear, () =>
			g.get("fantasyPoints"),
		),
		hockey: processPlayerStatsHockey(ps, stats, statType, bornYear),
	});
};

export default processPlayerStats;
