import { idb } from "..";
import { g } from "../../util";
import type { GetCopyType, PlayoffSeries } from "../../../common/types";
import { maybeDeepCopy } from "../getCopies/helpers";

const getCopy = async (
	{
		season,
	}: {
		season: number;
	},
	type?: GetCopyType,
): Promise<PlayoffSeries | undefined> => {
	if (season === g.get("season")) {
		return maybeDeepCopy(await idb.cache.playoffSeries.get(season), type);
	}

	return idb.league.get("playoffSeries", season);
};

export default getCopy;
