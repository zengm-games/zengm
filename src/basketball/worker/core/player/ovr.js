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
        ((0.18 * (ratings.hgt - 47)) / 14 +
            (0.05 * (ratings.stre - 50)) / 11 +
            (0.15 * (ratings.spd - 53)) / 16 +
            (0.13 * (ratings.jmp - 51)) / 17 +
            (0.02 * (ratings.endu - 41)) / 13 +
            (0.02 * (ratings.ins - 42)) / 13 +
            (0.02 * (ratings.dnk - 49)) / 13 +
            (0.01 * (ratings.ft - 47)) / 13 +
            (0.01 * (ratings.fg - 47)) / 13 +
            (0.09 * (ratings.tp - 47)) / 13 +
            (0.09 * (ratings.oiq - 46)) / 11 +
            (0.09 * (ratings.diq - 46)) / 11 +
            (0.06 * (ratings.drb - 55)) / 11 +
            (0.03 * (ratings.pss - 51)) / 12 +
            (0.05 * (ratings.reb - 51)) / 12) *
            13.55 +
        47.47;

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
