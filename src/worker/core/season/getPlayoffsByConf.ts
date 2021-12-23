import type { GameAttributesLeague } from "../../../common/types";
import { idb } from "../../db";
import { g } from "../../util";

const getPlayoffsByConf = async (
	season: number,
	overrides?: {
		skipPlayoffSeries: boolean;
		playoffsByConf: GameAttributesLeague["playoffsByConf"];
		confs: GameAttributesLeague["confs"];
	},
) => {
	if (!overrides?.skipPlayoffSeries) {
		const playoffSeries = await idb.getCopy.playoffSeries(
			{ season },
			"noCopyCache",
		);

		if (playoffSeries && playoffSeries.byConf !== undefined) {
			// This is the most authoritative source, because it also handles the case where the setting is enabled but a conference doesn't have enough teams
			return playoffSeries.byConf;
		}
	}

	const playoffsByConf = overrides?.playoffsByConf ?? g.get("playoffsByConf");
	const confs = overrides?.confs ?? g.get("confs", season);

	return playoffsByConf && confs.length === 2;
};

export default getPlayoffsByConf;
