// @flow

import countBy from "lodash/countBy";
import type { TeamFiltered } from "../../../common/types";

/**
 * Divide the combinations between teams with tied records.
 *
 * If isFinal is true, the remainder value is distributed randomly instead
 * of being set as a decimal value on the result.
 */
const updateChances = (
    chances: number[],
    teams: TeamFiltered[],
    isFinal?: boolean = false,
) => {
    let wps = countBy(teams, t => t.seasonAttrs.winp);
    wps = Object.entries(wps)
        .map(x => [Number(x[0]), Number(x[1])])
        .sort((a, b) => a[0] - b[0]);
    let tc = 0;

    for (let k = 0; k < wps.length; k++) {
        let val = wps[k][1];
        if (val > 1) {
            if (tc + val >= chances.length) {
                val -= tc + val - chances.length;
                // Do not exceed 14, as the chances are only for lottery teams.
            }
            const total = chances.slice(tc, tc + val).reduce((a, b) => a + b);
            let remainder = isFinal ? total % val : 0;
            const newVal = (total - remainder) / val;

            let i;
            let j;
            for (i = tc, j = tc + val; i < j; i++) {
                chances[i] = newVal;
                if (remainder > 0) {
                    chances[i] += 1;
                    remainder--;
                }
            }
        }
        tc += val;
        if (tc >= chances.length) {
            break;
        }
    }
};

export default updateChances;
