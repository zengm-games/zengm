import type { ByConf } from "../../../common/types.ts";
import { idb } from "../../db/index.ts";
import { g } from "../../util/index.ts";
import { getNumPlayoffByes } from "./getNumPlayoffByes.ts";
import getPlayoffsByConf from "./getPlayoffsByConf.ts";

export const getNumPlayoffTeamsRaw = ({
	numRounds,
	numPlayoffByes,
	playIn,
	byConf,
}: {
	numRounds: number;
	numPlayoffByes: number;
	playIn: boolean;
	byConf: ByConf;
}) => {
	const numPlayoffTeams = 2 ** numRounds - numPlayoffByes;
	let numPlayInTeams = 0;
	if (playIn) {
		if (byConf) {
			numPlayInTeams += 2 * byConf;
		} else {
			numPlayInTeams += 2;
		}
	}

	return {
		numPlayoffTeams,
		numPlayInTeams,
	};
};

const getNumPlayoffTeams = async (season: number) => {
	const numRounds = g.get("numGamesPlayoffSeries", season).length;
	const byConf = await getPlayoffsByConf(season);
	const numPlayoffByes = getNumPlayoffByes({
		numPlayoffByes: g.get("numPlayoffByes", season),
		byConf,
	});

	const playoffSeries = await idb.getCopy.playoffSeries(
		{ season },
		"noCopyCache",
	);
	const playIn = playoffSeries ? !!playoffSeries.playIns : g.get("playIn");

	return getNumPlayoffTeamsRaw({
		numRounds,
		numPlayoffByes,
		playIn,
		byConf,
	});
};

export default getNumPlayoffTeams;
