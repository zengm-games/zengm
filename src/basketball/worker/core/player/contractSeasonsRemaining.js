// @flow

import { g } from "../../util";

/**
 * How many seasons are left on this contract? The answer can be a fraction if the season is partially over
 *
 * @memberOf core.player
 * @param {Object} exp Contract expiration year.
 * @return {number} numGamesRemaining Number of games remaining in the current season (0 to g.numGames).
 */
const contractSeasonsRemaining = (
    exp: number,
    numGamesRemaining: number,
): number => {
    let frac = numGamesRemaining / g.numGames;
    if (frac > 1) {
        frac = 1;
    } // This only happens if the user changed g.numGames mid season
    return exp - g.season + frac;
};

export default contractSeasonsRemaining;
