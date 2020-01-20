import { idb } from "..";
import { g, helpers } from "../../util";
import { PlayoffSeries } from "../../../common/types";

const getCopy = async ({
	season,
}: {
	season: number;
}): Promise<PlayoffSeries | void> => {
	if (season === g.get("season")) {
		return helpers.deepCopy(await idb.cache.playoffSeries.get(season));
	}

	return idb.league.get("playoffSeries", season);
};

export default getCopy;
