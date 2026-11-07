import { bySport } from "./sportFunctions.ts";
import { processStats as processPlayerStatsBaseball } from "./processPlayerStats.baseball.ts";
import {
	processStats as processPlayerStatsBasketball,
	type StatSumsExtra,
} from "./processPlayerStats.basketball.ts";
import { processStats as processPlayerStatsFootball } from "./processPlayerStats.football.ts";
import { processStats as processPlayerStatsHockey } from "./processPlayerStats.hockey.ts";
import type {
	GameAttributesLeague,
	PlayerStatsToProcess,
	PlayerStatType,
} from "./types.ts";
import { defaultGameAttributes } from "./defaultGameAttributes.ts";

// The default getFantasyPoints is only for when the fantasyPoints setting does not matter. Otherwise, use the ui/worker versions of this function, which use the current league's setting
export const processPlayerStats = (
	ps: PlayerStatsToProcess,
	stats: Iterable<string>,
	statType?: PlayerStatType,
	bornYear?: number,
	{
		getFantasyPoints = () => defaultGameAttributes.fantasyPoints,
		keepWithNoStats,
		statSumsExtra,
	}: {
		getFantasyPoints?: () => GameAttributesLeague["fantasyPoints"];
		keepWithNoStats?: boolean;
		statSumsExtra?: StatSumsExtra;
	} = {},
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
		football: processPlayerStatsFootball(ps, stats, bornYear, getFantasyPoints),
		hockey: processPlayerStatsHockey(ps, stats, statType, bornYear),
	});
};
