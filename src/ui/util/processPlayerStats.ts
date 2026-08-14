import { bySport } from "../../common/sportFunctions.ts";
import { processStats as processPlayerStatsBaseball } from "../../common/processPlayerStats.baseball.ts";
import { processStats as processPlayerStatsBasketball } from "../../common/processPlayerStats.basketball.ts";
import { processStats as processPlayerStatsFootball } from "../../common/processPlayerStats.football.ts";
import { processStats as processPlayerStatsHockey } from "../../common/processPlayerStats.hockey.ts";
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
