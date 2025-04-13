import { idb } from "../index.ts";
import { g } from "../../util/index.ts";
import type { GetCopyType, PlayoffSeries } from "../../../common/types.ts";
import { maybeDeepCopy } from "../getCopies/helpers.ts";

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
