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
        (4 * ratings.hgt +
            8 * ratings.stre +
            13 * ratings.spd +
            3 * ratings.jmp +
            1 * ratings.endu +
            9 * ratings.ins +
            9 * ratings.dnk +
            2 * ratings.ft +
            2 * ratings.fg +
            2 * ratings.tp +
            16 * ratings.oiq +
            2 * ratings.diq +
            5 * ratings.drb +
            16 * ratings.pss +
            8 * ratings.reb) /
        100;

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
