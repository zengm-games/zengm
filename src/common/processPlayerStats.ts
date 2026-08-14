import { bySport } from "./sportFunctions.ts";
import { processStats as processPlayerStatsBaseball } from "./processPlayerStats.baseball.ts";
import { processStats as processPlayerStatsBasketball } from "./processPlayerStats.basketball.ts";
import { processStats as processPlayerStatsFootball } from "./processPlayerStats.football.ts";
import { processStats as processPlayerStatsHockey } from "./processPlayerStats.hockey.ts";
import type { PlayerStats, PlayerStatType } from "./types.ts";
import { defaultGameAttributes } from "./defaultGameAttributes.ts";

// ONLY USE THIS IF THE fantasySports SETTING DOES NOT MATTER!!! Otherwise, use it from ui/worker
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
			return defaultGameAttributes.fantasyPoints;
		}),
		hockey: processPlayerStatsHockey(ps, stats, statType, bornYear),
	});
};
