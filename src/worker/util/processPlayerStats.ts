import { bySport } from "../../common/sportFunctions.ts";
import {
	processStats as processStatsBaseball,
	statFunctions as statFunctionsBaseball,
} from "../../common/processPlayerStats.baseball.ts";
import {
	processStats as processStatsBasketball,
	statFunctions as statFunctionsBasketball,
} from "../../common/processPlayerStats.basketball.ts";
import {
	processStats as processStatsFootball,
	statFunctions as statFunctionsFootball,
} from "../../common/processPlayerStats.football.ts";
import {
	processStats as processStatsHockey,
	statFunctions as statFunctionsHockey,
} from "../../common/processPlayerStats.hockey.ts";
import type { StatSumsExtra } from "../../common/processPlayerStats.basketball.ts";
import type { PlayerStats, PlayerStatType } from "../../common/types.ts";
import g from "./g.ts";

export const processPlayerStats = (
	ps: PlayerStats,
	stats: Iterable<string>,
	statType?: PlayerStatType,
	bornYear?: number,
	keepWithNoStats?: boolean,
	statSumsExtra?: StatSumsExtra,
) => {
	return bySport({
		baseball: processStatsBaseball(ps, stats, statType, bornYear),
		basketball: processStatsBasketball(
			ps,
			stats,
			statType,
			bornYear,
			keepWithNoStats,
			statSumsExtra,
		),
		football: processStatsFootball(ps, stats, bornYear, () =>
			g.get("fantasyPoints"),
		),
		hockey: processStatsHockey(ps, stats, statType, bornYear),
	});
};

export const derivedPlayerStatKeys = bySport({
	baseball: Object.keys(statFunctionsBaseball),
	basketball: Object.keys(statFunctionsBasketball),
	football: Object.keys(statFunctionsFootball),
	hockey: Object.keys(statFunctionsHockey),
});
