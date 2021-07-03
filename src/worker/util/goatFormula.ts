import { bySport } from "../../common";
import type { MinimalPlayerRatings, Player } from "../../common/types";
import { weightByMinutes } from "../db/getCopies/playersPlus";
import FormulaEvaluator from "./FormulaEvaluator";
import g from "./g";

const DEFAULT_FORMULA = bySport({
	basketball: "pts/gp + 2 * ast/gp + dwsPeak",
});

const STAT_VARIABLES = bySport({
	basketball: [
		"pts",
		"orb",
		"drb",
		"ast",
		"tov",
		"blk",
		"stl",
		"gp",
		"min",
		"per",
		"ewa",
		"ows",
		"dws",
		"obpm",
		"dbpm",
		"vorp",
	],
});

const formulaCache: Record<string, FormulaEvaluator<string[]>> = {};

const MIN_GP = bySport({
	basketball: 10,
	football: 5,
	hockey: 10,
});
const TOTAL_GP_FACTOR = 5;

const evaluate = (p: Player<MinimalPlayerRatings>, formula?: string) => {
	const goatFormula = formula ?? g.get("goatFormula") ?? DEFAULT_FORMULA;

	const object: Record<string, number> = {};

	for (const stat of STAT_VARIABLES) {
		const peak = `${stat}Peak`;
		const peakPerGame = `${stat}PeakPerGame`;
		const tot = stat;

		object[peak] = -Infinity;
		object[peakPerGame] = -Infinity;
		object[tot] = 0;

		const weightStatByMinutes = weightByMinutes.includes(stat);
		let minSum = 0;

		for (const row of p.stats) {
			if (row.gp === 0 || row.min === 0 || row.playoffs) {
				continue;
			}

			if (row.gp >= MIN_GP) {
				if (row[stat] > object[peak]) {
					object[peak] = row[stat];
				}

				const perGame = row[stat] / row.gp;
				if (perGame > object[peakPerGame]) {
					object[peakPerGame] = perGame;
				}
			}

			if (weightStatByMinutes) {
				object[tot] += row[stat] * row.min;
				minSum += row.min;
			} else {
				object[tot] += row[stat];
			}
		}

		if (weightStatByMinutes) {
			object[tot] /= minSum;
		}
	}

	// Ignore career totals from low games guys
	if (object.gp < MIN_GP * TOTAL_GP_FACTOR) {
		for (const stat of STAT_VARIABLES) {
			object[stat] = 0;
		}
	}

	if (!formulaCache[goatFormula]) {
		formulaCache[goatFormula] = new FormulaEvaluator(
			goatFormula,
			Object.keys(object),
		);
	}

	const value = formulaCache[goatFormula].evaluate(object);

	if (Number.isNaN(value)) {
		return -Infinity;
	}

	return value;
};

export default {
	DEFAULT_FORMULA,
	STAT_VARIABLES,
	evaluate,
};
