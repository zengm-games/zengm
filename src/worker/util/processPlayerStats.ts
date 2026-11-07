import { bySport } from "../../common/sportFunctions.ts";
import { statFunctions as statFunctionsBaseball } from "../../common/processPlayerStats.baseball.ts";
import { statFunctions as statFunctionsBasketball } from "../../common/processPlayerStats.basketball.ts";
import { statFunctions as statFunctionsFootball } from "../../common/processPlayerStats.football.ts";
import { statFunctions as statFunctionsHockey } from "../../common/processPlayerStats.hockey.ts";
import type { StatSumsExtra } from "../../common/processPlayerStats.basketball.ts";
import { processPlayerStats as processPlayerStatsCommon } from "../../common/processPlayerStats.ts";
import type {
	PlayerStatsToProcess,
	PlayerStatType,
} from "../../common/types.ts";
import g from "./g.ts";

export const processPlayerStats = (
	ps: PlayerStatsToProcess,
	stats: Iterable<string>,
	statType?: PlayerStatType,
	bornYear?: number,
	keepWithNoStats?: boolean,
	statSumsExtra?: StatSumsExtra,
) => {
	return processPlayerStatsCommon(ps, stats, statType, bornYear, {
		getFantasyPoints: () => g.get("fantasyPoints"),
		keepWithNoStats,
		statSumsExtra,
	});
};

export const derivedPlayerStatKeys = bySport({
	baseball: Object.keys(statFunctionsBaseball),
	basketball: Object.keys(statFunctionsBasketball),
	football: Object.keys(statFunctionsFootball),
	hockey: Object.keys(statFunctionsHockey),
});
