import type { Player } from "../../common/types.ts";
import stats from "../core/player/stats.ts";
import { weightByMinutes } from "../db/getCopies/playersPlus.ts";
import { FormulaEvaluator } from "./FormulaEvaluator.ts";
import g from "./g.ts";
import helpers from "./helpers.ts";
import { bySport, isSport } from "../../common/sportFunctions.ts";

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
		hockey: ["minAvailable", "gpSkater", "gpGoalie", "gMin"],
	}),
);

const STAT_VARIABLES = [...stats.derived, ...stats.raw].filter(
	(stat) => !BANNED_STAT_VARIABLES.has(stat),
);

// Need to maintain support for old award variables like "mvp" from before PlayerAwardBuiltIn existed
// key is the old variable name, value is the corresponding shortName in the new award format
const OLD_AWARD_VARIABLES = bySport<
	Record<
		string,
		{
			shortName: string;

			// This will be used for any legacy awards that somehow weren't upgraded or were custom added
			name: string;

			// For team awards, this is the team number. Leave undefined for individual awards or for all teams together (or if only one team)
			teamNum?: number;
		}
	>
>({
	baseball: {
		mvp: { shortName: "MVP", name: "Most Valuable Player" },
		roy: { shortName: "ROY", name: "Rookie of the Year" },
		poy: { shortName: "POY", name: "Pitcher of the Year" },
		rpoy: { shortName: "RPOY", name: "Relief Pitcher of the Year" },
		finalsMvp: { shortName: "FMVP", name: "Finals MVP" },
		allOffense: { shortName: "OFF", name: "All-Offensive Team" },
		allDefense: { shortName: "DEF", name: "All-Defensive Team" },
		allRookie: { shortName: "ALR", name: "All-Rookie Team" },
	},
	basketball: {
		mvp: { shortName: "MVP", name: "Most Valuable Player" },
		roy: { shortName: "ROY", name: "Rookie of the Year" },
		smoy: { shortName: "SMOY", name: "Sixth Man of the Year" },
		dpoy: { shortName: "DPOY", name: "Defensive Player of the Year" },
		mip: { shortName: "MIP", name: "Most Improved Player" },
		finalsMvp: { shortName: "FMVP", name: "Finals MVP" },
		sfmvp: { shortName: "SFMVP", name: "Semifinals MVP" },
		allLeague1: { shortName: "ALL", name: "First Team All-League", teamNum: 1 },
		allLeague2: {
			shortName: "ALL",
			name: "Second Team All-League",
			teamNum: 2,
		},
		allLeague3: { shortName: "ALL", name: "Third Team All-League", teamNum: 3 },
		allDefensive1: {
			shortName: "DEF",
			name: "First Team All-Defensive",
			teamNum: 1,
		},
		allDefensive2: {
			shortName: "DEF",
			name: "Second Team All-Defensive",
			teamNum: 2,
		},
		allDefensive3: {
			shortName: "DEF",
			name: "Third Team All-Defensive",
			teamNum: 3,
		},
		allRookie: { shortName: "ALR", name: "All-Rookie Team" },
	},
	football: {
		mvp: { shortName: "MVP", name: "Most Valuable Player" },
		opoy: { shortName: "OPOY", name: "Offensive Player of the Year" },
		poy: { shortName: "POY", name: "Protector of the Year" },
		dpoy: { shortName: "DPOY", name: "Defensive Player of the Year" },
		oroy: { shortName: "OROY", name: "Offensive Rookie of the Year" },
		droy: { shortName: "DROY", name: "Defensive Rookie of the Year" },
		finalsMvp: { shortName: "FMVP", name: "Finals MVP" },
		allLeague1: { shortName: "ALL", name: "First Team All-League", teamNum: 1 },
		allLeague2: {
			shortName: "ALL",
			name: "Second Team All-League",
			teamNum: 2,
		},
		allRookie: { shortName: "ALR", name: "All-Rookie Team" },
	},
	hockey: {
		mvp: { shortName: "MVP", name: "Most Valuable Player" },
		roy: { shortName: "ROY", name: "Rookie of the Year" },
		dpoy: { shortName: "DPOY", name: "Defensive Player of the Year" },
		dfoy: { shortName: "DFOY", name: "Defensive Forward of the Year" },
		goy: { shortName: "GOY", name: "Goalie of the Year" },
		finalsMvp: { shortName: "PMVP", name: "Playoffs MVP" },
		allLeague1: { shortName: "ALL", name: "First Team All-League", teamNum: 1 },
		allLeague2: {
			shortName: "ALL",
			name: "Second Team All-League",
			teamNum: 2,
		},
		allRookie: { shortName: "ALR", name: "All-Rookie Team" },
	},
});

const SIMPLE_AWARD_VARIABLES: Record<string, string> = {
	champ: "Won Championship",
	allStar: "All-Star",
	allStarMvp: "All-Star MVP",
	numSeasons: "Number of Seasons Played",
};

const formulaCache: Record<string, FormulaEvaluator<string[], string[]>> = {};

const evaluate = (
	p: Player,
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
		baseball: 5,
		basketball: 10,
		football: 5,
		hockey: 10,
	});
	const MIN_GP_TOTAL = MIN_GP_SEASON * 3;

	const goatFormula =
		formula ??
		(info.type === "career"
			? (g.get("goatFormula") ?? DEFAULT_FORMULA)
			: (g.get("goatSeasonFormula") ?? DEFAULT_FORMULA_SEASON));

	const object: Record<string, number> = {};

	const statsRows = p.stats.filter((row) => {
		if (info.type === "season" && row.season !== info.season) {
			return false;
		}

		// Don't check row.min being 0, since that is true for some historical stats before 1952
		if (row.gp === 0) {
			return false;
		}

		return true;
	});

	// Ignore players with no valid stats, so there isn't weirdness like -ewaPeak being shown as Infinity
	if (statsRows.length === 0) {
		return -Infinity;
	}

	for (const stat of STAT_VARIABLES) {
		const peak = `${stat}Peak`;
		const peakPerGame = `${stat}PeakPerGame`;
		const tot = stat;
		const playoffs = `${stat}Playoffs`;

		object[peak] = -Infinity;
		object[peakPerGame] = -Infinity;
		object[tot] = 0;
		object[playoffs] = 0;

		const weightStatByMinutes = weightByMinutes.has(stat);
		let minSum = 0;
		let minSumPlayoffs = 0;

		for (const row of statsRows) {
			if (row[stat] === undefined) {
				// For missing values in historical real players data
				continue;
			}

			if (row.playoffs) {
				if (weightStatByMinutes) {
					object[playoffs] += row[stat] * row.min;
					minSumPlayoffs += row.min;
				} else if (isSport("football") && stat.endsWith("Lng")) {
					if (row[stat] > object[playoffs]) {
						object[playoffs] = row[stat] as number;
					}
				} else {
					object[playoffs] += row[stat];
				}
			} else {
				if (info.type === "career") {
					if (row[stat] > object[peak]!) {
						object[peak] = row[stat];
					}

					const perGame = helpers.ratio(row[stat], row.gp);
					if (perGame > object[peakPerGame]) {
						object[peakPerGame] = perGame;
					}
				}

				if (weightStatByMinutes) {
					object[tot] += row[stat] * row.min;
					minSum += row.min;
				} else if (isSport("football") && stat.endsWith("Lng")) {
					if (row[stat] > object[tot]) {
						object[tot] = row[stat] as number;
					}
				} else {
					object[tot] += row[stat];
				}
			}
		}

		if (weightStatByMinutes) {
			object[tot] = helpers.ratio(object[tot], minSum);
			object[playoffs] = helpers.ratio(object[playoffs], minSumPlayoffs);
		}
	}

	for (const stat of STAT_VARIABLES) {
		const perGame = `${stat}PerGame`;
		const playoffsPerGame = `${stat}PlayoffsPerGame`;
		const tot = stat;
		const playoffs = `${stat}Playoffs`;

		object[perGame] = 0;
		object[playoffsPerGame] = 0;

		if (object.gp! > 0) {
			object[perGame] = object[tot]! / object.gp!;
		}

		if (object.gpPlayoffs! > 0) {
			object[playoffsPerGame] = object[playoffs]! / object.gpPlayoffs!;
		}
	}

	if (info.type === "season") {
		object.numSeasons = 1;
	} else {
		const seasons = new Set();
		for (const row of p.stats) {
			// gp is for real player data before minutes were tracked
			if (row.min > 0 || row.gp > 0) {
				seasons.add(row.season);
			}
		}
		object.numSeasons = seasons.size;
	}

	// Make sure these are always defined, even for players with no awards
	for (const short of Object.keys(SIMPLE_AWARD_VARIABLES)) {
		if (short === "numSeasons") {
			continue;
		}

		object[short] = 0;
	}
	for (const short of Object.keys(OLD_AWARD_VARIABLES)) {
		object[short] = 0;
	}

	const awards: Record<string, number> = {};
	for (const row of p.awards) {
		if (info.type === "season" && row.season !== info.season) {
			continue;
		}

		for (const [short, long] of Object.entries(SIMPLE_AWARD_VARIABLES)) {
			if (short === "numSeasons") {
				continue;
			}

			if (info.type === "season" && row.season !== info.season) {
				continue;
			}

			object[short] ??= 0;
			if (row.type === long) {
				object[short]! += 1;
			}
		}

		for (const [short, awardInfo] of Object.entries(OLD_AWARD_VARIABLES)) {
			object[short] ??= 0;
			if (row.type === undefined) {
				if (row.shortName === awardInfo.shortName) {
					if (row.numTeams === undefined) {
						// Individual award - must be #1
						if (row.rank === 1) {
							object[short] += 1;
						}
					} else {
						// Team award
						if (awardInfo.teamNum === undefined) {
							// Any will do
							object[short] += 1;
						} else if (awardInfo.teamNum === row.rank) {
							// Specific team number
							object[short] += 1;
						}
					}
				}
			} else if (row.type === awardInfo.name) {
				object[short] += 1;
			}
		}

		if (row.type === undefined) {
			const shortName = row.shortName;
			if (row.numTeams === undefined) {
				// Individual award - must be #1
				if (row.rank === 1) {
					awards[shortName] ??= 0;
					awards[shortName] += 1;
				}
			} else {
				// Team award

				// Count for any team
				awards[shortName] ??= 0;
				awards[shortName] += 1;

				// Count for specific teamNum
				const shortTeamWithTeamNum = `${shortName}${row.rank}`;
				awards[shortTeamWithTeamNum] ??= 0;
				awards[shortTeamWithTeamNum] += 1;
			}
		}
	}
	object.awards = awards as any;

	// Ignore career totals from low games guys
	const minGp = info.type === "season" ? MIN_GP_SEASON : MIN_GP_TOTAL;
	const minGpPlayoffs = info.type === "season" ? 0 : MIN_GP_TOTAL / 2;
	if (object.gp! < minGp) {
		for (const stat of STAT_VARIABLES) {
			object[stat] = 0;
			object[`${stat}PerGame`] = 0;
		}
	}
	if (object.gpPlayoffs! < minGpPlayoffs) {
		for (const stat of STAT_VARIABLES) {
			object[`${stat}Playoffs`] = 0;
			object[`${stat}PlayoffsPerGame`] = 0;
		}
	}

	if (!formulaCache[goatFormula]) {
		formulaCache[goatFormula] = new FormulaEvaluator(
			goatFormula,
			Object.keys(object),
			["awards"],
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
	DEFAULT_FORMULA_SEASON,
	OLD_AWARD_VARIABLES,
	SIMPLE_AWARD_VARIABLES,
	STAT_VARIABLES,
	evaluate,
};
