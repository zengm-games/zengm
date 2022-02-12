import { idb } from "../../db";
import { g } from "../../util";
import getPlayoffsByConf from "./getPlayoffsByConf";

export const getNumPlayoffTeamsRaw = ({
	numRounds,
	numPlayoffByes,
	playIn,
	byConf,
}: {
	numRounds: number;
	numPlayoffByes: number;
	playIn: boolean;
	byConf: boolean;
}) => {
	const numPlayoffTeams = 2 ** numRounds - numPlayoffByes;
	let numPlayInTeams = 0;
	if (playIn) {
		if (byConf) {
			numPlayInTeams += 4;
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
	const numPlayoffByes = g.get("numPlayoffByes", season);

	const byConf = await getPlayoffsByConf(season);

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
