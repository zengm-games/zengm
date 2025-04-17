import { idb } from "../../db/index.ts";
import { g } from "../../util/index.ts";

export const isFinals = async () => {
	const numGamesPlayoffSeries = g.get("numGamesPlayoffSeries", "current");
	const playoffSeries = await idb.cache.playoffSeries.get(g.get("season"));

	return playoffSeries?.currentRound === numGamesPlayoffSeries.length - 1;
};
