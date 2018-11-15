// @flow

import range from "lodash/range";

const getValidNumPlayoffRounds = (numPlayoffRounds, numTeams) => {
    if (
        typeof numPlayoffRounds !== "number" ||
        Number.isNaN(numPlayoffRounds) ||
        numPlayoffRounds <= 0
    ) {
        return 1;
    }

    for (let num = numPlayoffRounds; num > 0; num--) {
        const numPlayoffTeams = 2 ** num;
        if (numPlayoffTeams <= numTeams) {
            return num;
        }
    }

    throw new Error("Cannot find numPlayoffTeams less than numTeams");
};

// Ensure numGamesPlayoffSeries doesn't have an invalid value, relative to numTeams. And if numPlayoffRounds is
// specified (old leagues), use that to set numGamesPlayoffSeries.
const getValidNumGamesPlayoffSeries = (
    numGamesPlayoffSeries: number[],
    initialNumPlayoffRounds: number | void,
    numTeams: number,
) => {
    const numPlayoffRounds = getValidNumPlayoffRounds(
        initialNumPlayoffRounds !== undefined
            ? initialNumPlayoffRounds
            : numGamesPlayoffSeries.length,
        numTeams,
    );

    if (!Array.isArray(numGamesPlayoffSeries)) {
        // This should never happen!
        return range(numPlayoffRounds).map(() => 7);
    }

    if (numGamesPlayoffSeries.length > numPlayoffRounds) {
        // $FlowFixMe
        return numGamesPlayoffSeries.slice(0, numPlayoffRounds);
    }

    numGamesPlayoffSeries = [...numGamesPlayoffSeries];
    while (numGamesPlayoffSeries.length < numPlayoffRounds) {
        const numGames =
            numGamesPlayoffSeries.length > 0
                ? numGamesPlayoffSeries[numGamesPlayoffSeries.length - 1]
                : 7;
        numGamesPlayoffSeries.push(numGames);
    }
    return numGamesPlayoffSeries;
};

export default getValidNumGamesPlayoffSeries;
