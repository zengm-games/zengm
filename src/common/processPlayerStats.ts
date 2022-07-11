import bySport from "./bySport";
import processPlayerStatsBaseball from "./processPlayerStats.baseball";
import processPlayerStatsBasketball from "./processPlayerStats.basketball";
import processPlayerStatsFootball from "./processPlayerStats.football";
import processPlayerStatsHockey from "./processPlayerStats.hockey";
import type { PlayerStats, PlayerStatType } from "./types";
import defaultGameAttributes from "./defaultGameAttributes";

// ONLY USE THIS IF THE fantasySports SETTING DOES NOT MATTER!!! Otherwise, use it from ui
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
			return defaultGameAttributes.fantasyPoints;
		}),
		hockey: processPlayerStatsHockey(ps, stats, statType, bornYear),
	});
};

export default processPlayerStats;
