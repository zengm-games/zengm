import range from "lodash-es/range";

const getValidNumPlayoffRounds = (
	numPlayoffRounds: number,
	numActiveTeams: number,
) => {
	if (
		typeof numPlayoffRounds !== "number" ||
		Number.isNaN(numPlayoffRounds) ||
		numPlayoffRounds <= 0
	) {
		return 1;
	}

	for (let num = numPlayoffRounds; num > 0; num--) {
		const numPlayoffTeams = 2 ** num;

		if (numPlayoffTeams <= numActiveTeams) {
			return num;
		}
	}

	throw new Error("Cannot find numPlayoffTeams less than numActiveTeams");
};

// Ensure numGamesPlayoffSeries doesn't have an invalid value, relative to numActiveTeams. And if numPlayoffRounds is
// specified (old leagues), use that to set numGamesPlayoffSeries.
const getValidNumGamesPlayoffSeries = (
	numGamesPlayoffSeries: number[],
	initialNumPlayoffRounds: number | undefined,
	numActiveTeams: number,
) => {
	const numPlayoffRounds = getValidNumPlayoffRounds(
		initialNumPlayoffRounds !== undefined
			? initialNumPlayoffRounds
			: numGamesPlayoffSeries.length,
		numActiveTeams,
	);

	if (!Array.isArray(numGamesPlayoffSeries)) {
		// This should never happen!
		return range(numPlayoffRounds).map(() => 7);
	}

	if (numGamesPlayoffSeries.length > numPlayoffRounds) {
		return numGamesPlayoffSeries.slice(0, numPlayoffRounds);
	}

	numGamesPlayoffSeries = [...numGamesPlayoffSeries];

	while (numGamesPlayoffSeries.length < numPlayoffRounds) {
		const numGames =
			numGamesPlayoffSeries.length > 0 ? numGamesPlayoffSeries.at(-1) : 7;
		numGamesPlayoffSeries.push(numGames);
	}

	return numGamesPlayoffSeries;
};

export default getValidNumGamesPlayoffSeries;
