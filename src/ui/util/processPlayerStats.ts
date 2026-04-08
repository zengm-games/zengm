import { bySport } from "../../common/bySport.ts";
import processPlayerStatsBaseball from "../../common/processPlayerStats.baseball.ts";
import processPlayerStatsBasketball from "../../common/processPlayerStats.basketball.ts";
import processPlayerStatsFootball from "../../common/processPlayerStats.football.ts";
import processPlayerStatsHockey from "../../common/processPlayerStats.hockey.ts";
import type { PlayerStats, PlayerStatType } from "../../common/types.ts";
import { local } from "./local.ts";

export const processPlayerStats = (
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
