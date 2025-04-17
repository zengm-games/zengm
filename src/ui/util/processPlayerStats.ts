import {
	bySport,
	processPlayerStatsBaseball,
	processPlayerStatsBasketball,
	processPlayerStatsFootball,
	processPlayerStatsHockey,
} from "../../common/index.ts";
import type { PlayerStats, PlayerStatType } from "../../common/types.ts";
import { local } from "./local.ts";

const processPlayerStats = (
	ps: PlayerStats,
	stats: string[],
	statType?: PlayerStatType,
	bornYear?: number,
) => {
	return bySport({
		baseball: processPlayerStatsBaseball(ps, stats, statType, bornYear),
		basketball: processPlayerStatsBasketball(ps, stats, statType, bornYear),
		football: processPlayerStatsFootball(ps, stats, bornYear, () => {
			return local.getState().fantasyPoints;
		}),
		hockey: processPlayerStatsHockey(ps, stats, statType, bornYear),
	});
};

export default processPlayerStats;
