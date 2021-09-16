import { AWARD_NAMES, bySport, isSport } from "../../common";
import type { MinimalPlayerRatings, Player } from "../../common/types";
import stats from "../core/player/stats";
import { weightByMinutes } from "../db/getCopies/playersPlus";
import FormulaEvaluator from "./FormulaEvaluator";
import g from "./g";

const DEFAULT_FORMULA = bySport({
	basketball: "20 * mvp + pts/gp + 2 * ast/gp + dwsPeak",
	football:
		"20 * mvp + defTckSolo + defTckAst + 3 * pssTD + 10 * (rusTD + recTD)",
	hockey: "20 * mvp + ops + dps + gps",
});

const BANNED_STAT_VARIABLES = new Set(["minAvailable", "gpSkater", "gpGoalie"]);

const STAT_VARIABLES = [...stats.derived, ...stats.raw].filter(
	stat => !BANNED_STAT_VARIABLES.has(stat),
);

const AWARD_VARIABLES: Record<string, string> = {
	champ: "Won Championship",
};
for (const [short, long] of Object.entries(AWARD_NAMES)) {
	if (short === "allDefensive" || short === "allLeague") {
		AWARD_VARIABLES[`${short}1`] = `First Team ${long}`;
		AWARD_VARIABLES[`${short}2`] = `Second Team ${long}`;

		// 3rd team is only in historical real data
		if (isSport("basketball")) {
			AWARD_VARIABLES[`${short}3`] = `Third Team ${long}`;
		}
	} else {
		AWARD_VARIABLES[short] = long;
	}
}
if (isSport("basketball")) {
	AWARD_VARIABLES.allStar = "All-Star";
	AWARD_VARIABLES.allStarMvp = "All-Star MVP";
}
AWARD_VARIABLES.numSeasons = "Number of Seasons Played";

const formulaCache: Record<string, FormulaEvaluator<string[]>> = {};

const MIN_GP_SEASON = bySport({
	basketball: 10,
	football: 5,
	hockey: 10,
});
const MIN_GP_TOTAL = bySport({
	basketball: 50,
	football: 10,
	hockey: 50,
});

const evaluate = (p: Player<MinimalPlayerRatings>, formula?: string) => {
	const goatFormula = formula ?? g.get("goatFormula") ?? DEFAULT_FORMULA;

	const object: Record<string, number> = {};

	for (const stat of STAT_VARIABLES) {
		const peak = `${stat}Peak`;
		const peakPerGame = `${stat}PeakPerGame`;
		const tot = stat;
		const playoffs = `${stat}Playoffs`;

		object[peak] = -Infinity;
		object[peakPerGame] = -Infinity;
		object[tot] = 0;
		object[playoffs] = 0;

		const weightStatByMinutes = weightByMinutes.includes(stat);
		let minSum = 0;
		let minSumPlayoffs = 0;

		for (const row of p.stats) {
			// Don't check row.min being 0, since that is true for some historical stats before 1952
			if (row.gp === 0) {
				continue;
			}

			if (row.playoffs) {
				if (weightStatByMinutes) {
					object[playoffs] += row[stat] * row.min;
					minSumPlayoffs += row.min;
				} else {
					object[playoffs] += row[stat];
				}
			} else {
				if (row.gp >= MIN_GP_SEASON) {
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
		}

		if (weightStatByMinutes) {
			object[tot] /= minSum;
			object[playoffs] /= minSumPlayoffs;
		}
	}

	for (const stat of STAT_VARIABLES) {
		const perGame = `${stat}PerGame`;
		const playoffsPerGame = `${stat}PlayoffsPerGame`;
		const tot = stat;
		const playoffs = `${stat}Playoffs`;

		object[perGame] = 0;
		object[playoffsPerGame] = 0;

		if (object.gp > 0) {
			object[perGame] = object[tot] / object.gp;
		}

		if (object.gpPlayoffs > 0) {
			object[playoffsPerGame] = object[playoffs] / object.gpPlayoffs;
		}
	}

	for (const [short, long] of Object.entries(AWARD_VARIABLES)) {
		if (short === "numSeasons") {
			const seasons = new Set();
			for (const row of p.stats) {
				if (row.min > 0) {
					seasons.add(row.season);
				}
			}
			object[short] = seasons.size;
		} else {
			object[short] = 0;
			for (const { type } of p.awards) {
				if (type === long) {
					object[short] += 1;
				}
			}
		}
	}

	// Ignore career totals from low games guys
	if (object.gp < MIN_GP_TOTAL) {
		for (const stat of STAT_VARIABLES) {
			object[stat] = 0;
			object[`${stat}PerGame`] = 0;
		}
	}
	if (object.gpPlayoffs < MIN_GP_TOTAL / 2) {
		for (const stat of STAT_VARIABLES) {
			object[`${stat}Playoffs`] = 0;
			object[`${stat}PlayoffsPerGame`] = 0;
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
	AWARD_VARIABLES,
	DEFAULT_FORMULA,
	STAT_VARIABLES,
	evaluate,
};
