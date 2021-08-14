import { idb } from "../../db";
import { g } from "../../util";

const getPlayoffsByConf = async (season: number) => {
	const playoffSeries = await idb.getCopy.playoffSeries({ season });

	if (playoffSeries && playoffSeries.byConf !== undefined) {
		// This is the most authoritative source, because it also handles the case where the setting is enabled but a conference doesn't have enough teams
		return playoffSeries.byConf;
	}

	return g.get("playoffsByConf") && g.get("confs", season).length === 2;
};

export default getPlayoffsByConf;
