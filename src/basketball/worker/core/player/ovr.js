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
        ((0.23 * (ratings.hgt - 47)) / 14 +
            (0.1 * (ratings.stre - 49)) / 11 +
            (0.22 * (ratings.spd - 51)) / 17 +
            (0.12 * (ratings.jmp - 48)) / 18 +
            (0.05 * (ratings.endu - 41)) / 13 +
            (0.03 * (ratings.ins - 42)) / 14 +
            (0.03 * (ratings.dnk - 49)) / 13 +
            (0.01 * (ratings.ft - 47)) / 12 +
            (0.01 * (ratings.fg - 47)) / 12 +
            (0.09 * (ratings.tp - 47)) / 12 +
            (0.09 * (ratings.oiq - 47)) / 10 +
            (0.13 * (ratings.diq - 47)) / 10 +
            (0.07 * (ratings.drb - 55)) / 11 +
            (0.07 * (ratings.pss - 51)) / 12 +
            (0.02 * (ratings.reb - 51)) / 12) *
            10.18 +
        48.36;

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
