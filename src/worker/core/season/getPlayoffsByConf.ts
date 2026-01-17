import type {
	GameAttributesLeague,
	PlayoffSeries,
} from "../../../common/types.ts";
import { idb } from "../../db/index.ts";
import { g } from "../../util/index.ts";

const isPowerOfTwoMinTwo = (n: number) => {
	return n >= 2 && (n & (n - 1)) === 0;
};

const getPlayoffsByConf = async (
	season: number,
	overrides?: {
		confs: GameAttributesLeague["confs"];
		playoffSeries?: PlayoffSeries;
		playoffsByConf: GameAttributesLeague["playoffsByConf"];
		skipPlayoffSeries: boolean;
	},
): Promise<number | false> => {
	if (!overrides?.skipPlayoffSeries) {
		const playoffSeries =
			overrides?.playoffSeries ??
			(await idb.getCopy.playoffSeries({ season }, "noCopyCache"));
		const byConf = playoffSeries?.byConf;

		if (byConf !== undefined) {
			// This is the most authoritative source, because it also handles the case where the setting is enabled but a conference doesn't have enough teams
			return byConf;
		}
	}

	// For past seasons this might not be accurate, since g.get("playoffsByConf") is the current value of that setting
	const playoffsByConf = overrides?.playoffsByConf ?? g.get("playoffsByConf");
	const confs = overrides?.confs ?? g.get("confs", season);

	const numConfs = confs.length;

	return playoffsByConf && isPowerOfTwoMinTwo(numConfs) ? numConfs : false;
};

export default getPlayoffsByConf;
