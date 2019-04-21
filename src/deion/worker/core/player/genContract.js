// @flow

import { g, helpers, random } from "../../util";
import type {
    MinimalPlayerRatings,
    Player,
    PlayerContract,
    PlayerWithoutPid,
} from "../../../common/types";

/**
 * Generate a contract for a player.
 *
 * @memberOf core.player
 * @param {Object} ratings Player object. At a minimum, this must have one entry in the ratings array.
 * @param {boolean} randomizeExp If true, then it is assumed that some random amount of years has elapsed since the contract was signed, thus decreasing the expiration date. This is used when generating players in a new league.
 * @return {Object.<string, number>} Object containing two properties with integer values, "amount" with the contract amount in thousands of dollars and "exp" with the contract expiration year.
 */
const genContract = (
    p: Player<MinimalPlayerRatings> | PlayerWithoutPid<MinimalPlayerRatings>,
    randomizeExp: boolean = false,
    randomizeAmount: boolean = true,
    noLimit: boolean = false,
): PlayerContract => {
    const ratings = p.ratings[p.ratings.length - 1];

    let factor = g.hardCap ? 1.75 : 3.4;

    if (process.env.SPORT === "football") {
        if (ratings.pos === "QB") {
            factor *= 1.5;
        } else if (ratings.pos === "K" || ratings.pos === "P") {
            factor *= 0.25;
        }
    }

    let amount =
        (p.value / 100 - 0.47) * factor * (g.maxContract - g.minContract) +
        g.minContract;
    if (randomizeAmount) {
        amount *= helpers.bound(random.realGauss(1, 0.1), 0, 2); // Randomize
    }

    // Expiration
    // Players with high potentials want short contracts
    const potentialDifference = Math.round((ratings.pot - ratings.ovr) / 4.0);
    let years = 5 - potentialDifference;
    if (years < 2) {
        years = 2;
    }
    // Bad players can only ask for short deals
    if (ratings.pot < 40) {
        years = 1;
    } else if (ratings.pot < 50) {
        years = 2;
    } else if (ratings.pot < 60) {
        years = 3;
    }

    // Randomize expiration for contracts generated at beginning of new game
    if (randomizeExp) {
        years = random.randInt(1, years);
    }

    const expiration = g.season + years - 1;

    if (!noLimit) {
        if (amount < g.minContract * 1.1) {
            amount = g.minContract;
        } else if (amount > g.maxContract) {
            amount = g.maxContract;
        }
    } else if (amount < 0) {
        // Well, at least keep it positive
        amount = 0;
    }

    amount = 50 * Math.round(amount / 50); // Make it a multiple of 50k

    return { amount, exp: expiration };
};

export default genContract;
