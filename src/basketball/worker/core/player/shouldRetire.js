// @flow

import { PLAYER } from "../../../common";
import { g, random } from "../../util";
import type {
    MinimalPlayerRatings,
    Player,
} from "../../../../deion/common/types";

// Players meeting one of these cutoffs might retire
const maxAge = 34;
const minPot = 40;

const shouldRetire = (p: Player<MinimalPlayerRatings>): boolean => {
    const age = g.season - p.born.year;
    const pot = p.ratings[p.ratings.length - 1].pot;

    // Only players older than 34 or without a contract will retire
    if (age > maxAge || (pot < minPot && p.tid === PLAYER.FREE_AGENT)) {
        // Only players older than 34 or without a contract will retire
        let excessAge = 0;
        if (age > 34) {
            excessAge = (age - maxAge) / 20; // 0.05 for each year beyond 34
        }
        const excessPot = (minPot - pot) / 50; // 0.02 for each potential rating below 40 (this can be negative)
        if (excessAge + excessPot + random.gauss(0, 1) > 0) {
            return true;
        }
    }

    return false;
};

export default shouldRetire;
