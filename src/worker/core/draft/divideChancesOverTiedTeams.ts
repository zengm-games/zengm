import countBy from "lodash-es/countBy";
import type { TeamFiltered } from "../../../common/types";
import { g } from "../../util";

/**
 * Divide the combinations between teams with tied records.
 *
 * If isFinal is true, the remainder value is distributed randomly instead
 * of being set as a decimal value on the result.
 */
const divideChancesOverTiedTeams = (
	chances: number[],
	teams: TeamFiltered<[], ["pts", "winp"], any, number>[],
	isFinal: boolean = false,
) => {
	const usePts = g.get("pointsFormula", "current") !== "";

	const wps0 = countBy(teams.slice(0, chances.length), t =>
		usePts ? t.seasonAttrs.pts : t.seasonAttrs.winp,
	);
	const wps = Object.entries(wps0)
		.map(x => [Number(x[0]), Number(x[1])])
		.sort((a, b) => a[0] - b[0]);
	let tc = 0;

	for (let k = 0; k < wps.length; k++) {
		let val = wps[k][1];

		if (val > 1) {
			if (tc + val >= chances.length) {
				val -= tc + val - chances.length; // Do not exceed 14, as the chances are only for lottery teams.
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

export default divideChancesOverTiedTeams;
