import { idb } from "../../db";
import { g } from "../../util";

export const isFinals = async () => {
	const numGamesPlayoffSeries = g.get("numGamesPlayoffSeries", "current");
	const playoffSeries = await idb.cache.playoffSeries.get(g.get("season"));

	return playoffSeries?.currentRound === numGamesPlayoffSeries.length - 1;
};
