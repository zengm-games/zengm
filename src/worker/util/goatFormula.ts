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
		const peak = `${key}Peak`;
		const peakPerGame = `${key}PeakPerGame`;
		const tot = key;

		object[peak] = -Infinity;
		object[peakPerGame] = -Infinity;
		object[tot] = 0;

		const weightKeyByMinutes = weightByMinutes.includes(key);
		let minSum = 0;

		for (const row of p.stats) {
			if (row.gp === 0 || row.min === 0 || row.playoffs) {
				continue;
			}

			if (row[key] > object[peak]) {
				object[peak] = row[key];
			}

			const perGame = row[key] / row.gp;
			if (perGame > object[peakPerGame]) {
				object[peakPerGame] = perGame;
			}

			if (weightKeyByMinutes) {
				object[tot] += row[key] * row.min;
				minSum += row.min;
			} else {
				object[tot] += row[key];
			}
		}

		if (weightKeyByMinutes) {
			object[tot] /= minSum;
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
