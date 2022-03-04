import {
	bySport,
	processPlayerStatsBaseball,
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
