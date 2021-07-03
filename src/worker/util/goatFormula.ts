import { bySport } from "../../common";
import type { MinimalPlayerRatings, Player } from "../../common/types";
import { weightByMinutes } from "../db/getCopies/playersPlus";
import FormulaEvaluator from "./FormulaEvaluator";
import g from "./g";

const DEFAULT_FORMULA = bySport({
	basketball: "ast + 5 * blk",
});

const CAREER_STAT_VARIABLES = bySport({
	basketball: [
		"gp",
		"min",
		"pts",
		"orb",
		"drb",
		"ast",
		"tov",
		"blk",
		"stl",
		"per",
		"ewa",
		"ws48",
		"ws",
		"bpm",
		"vorp",
	],
});

const formulaCache: Record<string, FormulaEvaluator<string[]>> = {};

const evaluate = (p: Player<MinimalPlayerRatings>, formula?: string) => {
	const goatFormula = formula ?? g.get("goatFormula") ?? DEFAULT_FORMULA;

	const object: Record<string, number> = {};

	for (const key of CAREER_STAT_VARIABLES) {
		const key2 = `${key}Peak`;

		object[key2] = -Infinity;

		for (const row of p.stats) {
			if (row.gp === 0 || row.min === 0 || row.playoffs) {
				continue;
			}

			if (row[key] > object[key2]) {
				object[key2] = row[key];
			}
		}
	}

	for (const key of CAREER_STAT_VARIABLES) {
		const key2 = key;

		object[key2] = 0;

		const weightKeyByMinutes = weightByMinutes.includes(key);
		let minSum = 0;

		for (const row of p.stats) {
			if (row.gp === 0 || row.min === 0 || row.playoffs) {
				continue;
			}

			if (weightKeyByMinutes) {
				object[key2] += row[key] * row.min;
				minSum += row.min;
			} else {
				object[key2] += row[key];
			}
		}

		if (weightKeyByMinutes) {
			object[key2] /= minSum;
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
	CAREER_STAT_VARIABLES,
	evaluate,
};
