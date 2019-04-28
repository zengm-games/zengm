// @flow

import { PLAYER } from "../../../common";
import { g, random } from "../../util";
import type { MinimalPlayerRatings, Player } from "../../../common/types";

// Players meeting one of these cutoffs might retire
let maxAge = 34;
const minPot = process.env.SPORT === "basketball" ? 40 : 50;

const shouldRetire = (p: Player<MinimalPlayerRatings>): boolean => {
    const age = g.season - p.born.year;
    const { pos, pot } = p.ratings[p.ratings.length - 1];

    if (process.env.SPORT === "football") {
        maxAge = pos === "QB" || pos === "P" || pos === "K" ? 32 : 28;
    }

    // Only players older than maxAge or without a contract will retire
    if (age > maxAge || (pot < minPot && p.tid === PLAYER.FREE_AGENT)) {
        // Only players older than maxAge or without a contract will retire
        let excessAge = 0;
        if (age > maxAge) {
            excessAge =
                (age - maxAge) / (process.env.SPORT === "basketball" ? 20 : 40); // 0.05 or 0.025 for each year beyond maxAge
        }
        const excessPot = (minPot - pot) / 50; // 0.02 for each potential rating below minPot (this can be negative)
        if (excessAge + excessPot + random.gauss(0, 1) > 0) {
            return true;
        }
    }

    return false;
};

export default shouldRetire;
