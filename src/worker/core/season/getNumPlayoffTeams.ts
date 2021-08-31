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
	let numPlayoffTeams = 2 ** numRounds - numPlayoffByes;
	if (playIn) {
		if (byConf) {
			numPlayoffTeams += 4;
		} else {
			numPlayoffTeams += 2;
		}
	}

	return numPlayoffTeams;
};

const getNumPlayoffTeams = async (season: number) => {
	const numRounds = g.get("numGamesPlayoffSeries", season).length;
	const numPlayoffByes = g.get("numPlayoffByes", season);

	const byConf = await getPlayoffsByConf(season);

	const playoffSeries = await idb.getCopy.playoffSeries({ season });
	const playIn = playoffSeries ? !!playoffSeries.playIns : g.get("playIn");

	return getNumPlayoffTeamsRaw({
		numRounds,
		numPlayoffByes,
		playIn,
		byConf,
	});
};

export default getNumPlayoffTeams;
