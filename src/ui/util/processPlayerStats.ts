import { processPlayerStats as processPlayerStatsCommon } from "../../common/processPlayerStats.ts";
import type {
	PlayerStatsToProcess,
	PlayerStatType,
} from "../../common/types.ts";
import { local } from "./local.ts";

export const processPlayerStats = (
	ps: PlayerStatsToProcess,
	stats: string[],
	statType?: PlayerStatType,
	bornYear?: number,
) => {
	return processPlayerStatsCommon(ps, stats, statType, bornYear, {
		getFantasyPoints: () => local.getState().fantasyPoints,
	});
};
