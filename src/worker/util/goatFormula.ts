import { AWARD_NAMES, bySport, isSport } from "../../common";
import defaultGameAttributes from "../../common/defaultGameAttributes";
import type { MinimalPlayerRatings, Player } from "../../common/types";
import stats from "../core/player/stats";
import { weightByMinutes } from "../db/getCopies/playersPlus";
import FormulaEvaluator from "./FormulaEvaluator";
import g from "./g";

const DEFAULT_FORMULA = bySport({
	baseball: "20 * mvp + war",
	basketball: "20 * mvp + pts/gp + 2 * ast/gp + dwsPeak",
	football:
		"20 * mvp + defTckSolo + defTckAst + 3 * pssTD + 10 * (rusTD + recTD)",
	hockey: "20 * mvp + ops + dps + gps",
});

const DEFAULT_FORMULA_SEASON = bySport({
	baseball: "5 * mvp + war",
	basketball: "5 * mvp + pts/gp + 2 * ast/gp + dws",
	football:
		"5 * mvp + defTckSolo + defTckAst + 3 * pssTD + 10 * (rusTD + recTD)",
	hockey: "5 * mvp + ops + dps + gps",
});

const BANNED_STAT_VARIABLES = new Set(
	bySport({
		baseball: ["minAvailable", "poSo", "rfld"],
		basketball: ["minAvailable"],
		football: ["minAvailable"],
		hockey: ["minAvailable", "gpSkater", "gpGoalie"],
	}),
);

const STAT_VARIABLES = [...stats.derived, ...stats.raw].filter(
	stat => !BANNED_STAT_VARIABLES.has(stat),
);

const AWARD_VARIABLES: Record<string, string> = {
	champ: "Won Championship",
	allStar: "All-Star",
	allStarMvp: "All-Star MVP",
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
AWARD_VARIABLES.numSeasons = "Number of Seasons Played";

const formulaCache: Record<string, FormulaEvaluator<string[]>> = {};

const evaluate = (
	p: Player<MinimalPlayerRatings>,
	formula: string | undefined,
	info:
		| {
				type: "career";
		  }
		| {
				type: "season";
				season: number;
		  },
) => {
	const MIN_GP_SEASON = bySport({
		baseball: 40,
		basketball: 20,
		football: 7,
		hockey: 20,
	});
	const MIN_GP_TOTAL = defaultGameAttributes.numGames;

	const goatFormula =
		formula ??
		(info.type === "career"
			? g.get("goatFormula") ?? DEFAULT_FORMULA
			: g.get("goatSeasonFormula") ?? DEFAULT_FORMULA_SEASON);

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
			if (info.type === "season" && row.season !== info.season) {
				continue;
			}

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
				if (info.type === "career") {
					if (row.gp >= MIN_GP_SEASON) {
						if (row[stat] > object[peak]) {
							object[peak] = row[stat];
						}

						const perGame = row[stat] / row.gp;
						if (perGame > object[peakPerGame]) {
							object[peakPerGame] = perGame;
						}
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
			if (info.type === "season") {
				object[short] = 1;
			} else {
				const seasons = new Set();
				for (const row of p.stats) {
					if (row.min > 0) {
						seasons.add(row.season);
					}
				}
				object[short] = seasons.size;
			}
		} else {
			object[short] = 0;
			for (const row of p.awards) {
				if (info.type === "season" && row.season !== info.season) {
					continue;
				}
				if (row.type === long) {
					object[short] += 1;
				}
			}
		}
	}

	// Ignore career totals from low games guys
	const minGp = info.type === "season" ? MIN_GP_SEASON : MIN_GP_TOTAL;
	const minGpPlayoffs = info.type === "season" ? 0 : MIN_GP_TOTAL / 2;
	if (object.gp < minGp) {
		for (const stat of STAT_VARIABLES) {
			object[stat] = 0;
			object[`${stat}PerGame`] = 0;
		}
	}
	if (object.gpPlayoffs < minGpPlayoffs) {
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
	DEFAULT_FORMULA_SEASON,
	STAT_VARIABLES,
	evaluate,
};
