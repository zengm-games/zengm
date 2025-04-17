import {
	bySport,
	processPlayerStatsBaseball,
	processPlayerStatsBasketball,
	processPlayerStatsFootball,
	processPlayerStatsHockey,
} from "../../common/index.ts";
import type { StatSumsExtra } from "../../common/processPlayerStats.basketball.ts";
import type { PlayerStats, PlayerStatType } from "../../common/types.ts";
import g from "./g.ts";

const processPlayerStats = (
	ps: PlayerStats,
	stats: string[],
	statType?: PlayerStatType,
	bornYear?: number,
	keepWithNoStats?: boolean,
	statSumsExtra?: StatSumsExtra,
) => {
	return bySport({
		baseball: processPlayerStatsBaseball(ps, stats, statType, bornYear),
		basketball: processPlayerStatsBasketball(
			ps,
			stats,
			statType,
			bornYear,
			keepWithNoStats,
			statSumsExtra,
		),
		football: processPlayerStatsFootball(ps, stats, bornYear, () =>
			g.get("fantasyPoints"),
		),
		hockey: processPlayerStatsHockey(ps, stats, statType, bornYear),
	});
};

export default processPlayerStats;
