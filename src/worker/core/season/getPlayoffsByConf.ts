import type { GameAttributesLeague } from "../../../common/types.ts";
import { idb } from "../../db/index.ts";
import { g } from "../../util/index.ts";

const isPowerOfTwoMinTwo = (n: number) => {
	return n >= 2 && (n & (n - 1)) === 0;
};

// Number of conferences that each have their own playoff bracket, or false if the playoffs aren't split by conference. This only uses the settings, so it works without a league, like when creating one or validating settings. For a season in the current league, use getPlayoffsByConf, because the playoff series is more authoritative.
export const getPlayoffsByConfFromSettings = ({
	confs,
	playoffsByConf,
}: {
	confs: GameAttributesLeague["confs"];
	playoffsByConf: GameAttributesLeague["playoffsByConf"];
}): number | false => {
	const numConfs = confs.length;

	return playoffsByConf && isPowerOfTwoMinTwo(numConfs) ? numConfs : false;
};

// For a season in the current league
export const getPlayoffsByConf = async (
	season: number,
): Promise<number | false> => {
	// A future season has no playoff series yet
	const isFutureSeason = season > g.get("season");
	if (!isFutureSeason) {
		const playoffSeries = await idb.merged.playoffSeries.get(season);
		const byConf = playoffSeries?.byConf;
		if (byConf !== undefined) {
			// This is the most authoritative source, because it also handles the case where the setting is enabled but a conference doesn't have enough teams
			return byConf;
		}
	}

	// For past seasons this might not be accurate, since g.get("playoffsByConf") is the current value of that setting
	return getPlayoffsByConfFromSettings({
		confs: g.get("confs", season),
		playoffsByConf: g.get("playoffsByConf"),
	});
};
