import type {
	GameAttributesLeague,
	PlayoffSeries,
} from "../../../common/types";
import { idb } from "../../db";
import { g } from "../../util";

const getPlayoffsByConf = async (
	season: number,
	overrides?: {
		confs: GameAttributesLeague["confs"];
		playoffSeries?: PlayoffSeries;
		playoffsByConf: GameAttributesLeague["playoffsByConf"];
		skipPlayoffSeries: boolean;
	},
) => {
	if (!overrides?.skipPlayoffSeries) {
		const playoffSeries =
			overrides?.playoffSeries ??
			(await idb.getCopy.playoffSeries({ season }, "noCopyCache"));

		if (playoffSeries && playoffSeries.byConf !== undefined) {
			// This is the most authoritative source, because it also handles the case where the setting is enabled but a conference doesn't have enough teams
			return playoffSeries.byConf;
		}
	}

	// For past seasons this might not be accurate, since g.get("playoffsByConf") is the current value of that setting
	const playoffsByConf = overrides?.playoffsByConf ?? g.get("playoffsByConf");
	const confs = overrides?.confs ?? g.get("confs", season);

	return playoffsByConf && confs.length === 2;
};

export default getPlayoffsByConf;
