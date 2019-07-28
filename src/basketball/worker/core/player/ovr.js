// @flow

import { helpers } from "../../../../deion/worker/util";
import type { PlayerRatings } from "../../../common/types";

/**
 * Calculates the overall rating by averaging together all the other ratings.
 *
 * @memberOf core.player
 * @param {Object.<string, number>} ratings Player's ratings object.
 * @return {number} Overall rating.
 */
const ovr = (ratings: PlayerRatings): number => {
    // This formula is loosely based on linear regression of ratings to zscore(ws48)+zscore(per):
    const r =
        ((0.19 * (ratings.hgt - 47)) / 14 +
            (0.07 * (ratings.stre - 50)) / 11 +
            (0.18 * (ratings.spd - 53)) / 16 +
            (0.15 * (ratings.jmp - 51)) / 17 +
            (0.02 * (ratings.endu - 42)) / 12 +
            (0.04 * (ratings.ins - 43)) / 13 +
            (0.02 * (ratings.dnk - 50)) / 13 +
            (0.01 * (ratings.ft - 48)) / 13 +
            (0.01 * (ratings.fg - 48)) / 13 +
            (0.1 * (ratings.tp - 48)) / 13 +
            (0.06 * (ratings.oiq - 47)) / 10 +
            (0.11 * (ratings.diq - 47)) / 11 +
            (0.06 * (ratings.drb - 56)) / 11 +
            (0.02 * (ratings.pss - 52)) / 12 +
            (0.05 * (ratings.reb - 51)) / 12) *
            12.36 +
        48.1;

    // Fudge factor to keep ovr ratings the same as they used to be (back before 2018 ratings rescaling)
    // +8 at 68
    // +4 at 50
    // -5 at 42
    // -10 at 31
    let fudgeFactor = 0;
    if (r >= 68) {
        fudgeFactor = 8;
    } else if (r >= 50) {
        fudgeFactor = 4 + (r - 50) * (4 / 18);
    } else if (r >= 42) {
        fudgeFactor = -5 + (r - 42) * (9 / 8);
    } else if (r >= 31) {
        fudgeFactor = -5 - (42 - r) * (5 / 11);
    } else {
        fudgeFactor = -10;
    }

    return helpers.bound(Math.round(r + fudgeFactor), 0, 100);
};

export default ovr;
