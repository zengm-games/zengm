import { helpers, PHASE } from "../../common";
import { idb } from "../db";
import g from "./g";
import type { TeamFiltered } from "../../common/types";
import advStatsSave from "./advStatsSave";
import { NUM_OUTS_PER_GAME } from "../../common/processPlayerStats.baseball";
import { POS_NUMBERS_INVERSE } from "../../common/constants.baseball";
import { groupByUnique } from "../../common/groupBy";
import range from "lodash-es/range";

const teamStats = [
	"h",
	"2b",
	"3b",
	"hr",
	"bb",
	"hbp",
	"ab",
	"er",
	"outs",
	"gp",
	"po",
	"a",
	"e",
	"dp",
	"poTot",
	"soPit",
	"pts",
] as const;

type Team = TeamFiltered<["tid"], ["ptsDefault"], typeof teamStats, number>;

const POSITIONAL_ADJUSTMENT_COEFFICIENTS = {
	C: 12.5,
	"1B": -12.5,
	"2B": 2.5,
	"3B": 2.5,
	SS: 7.5,
	LF: -7.5,
	CF: 2.5,
	RF: -7.5,
	DH: -17.5,
	P: 5,
};

const frP = (i: 0, t: Team, apl: number) => {
	const po = t.stats.po[i] ?? 0;
	const a = t.stats.a[i] ?? 0;
	const e = t.stats.e[i] ?? 0;
	const dp = t.stats.dp[i] ?? 0;
	const fr =
		0.1 * (po + 2 * a - e + dp) - apl * (t.stats.poTot - t.stats.soPit);
	if (Number.isNaN(fr)) {
		return 0;
	}
	return fr;
};

const frC = (i: 1, t: Team, apl: number) => {
	const po = t.stats.po[i] ?? 0;
	const a = t.stats.a[i] ?? 0;
	const e = t.stats.e[i] ?? 0;
	const dp = t.stats.dp[i] ?? 0;

	const fr =
		0.2 * (po - t.stats.soPit + 2 * a - e + dp) -
		apl * (t.stats.poTot - t.stats.soPit);
	if (Number.isNaN(fr)) {
		return 0;
	}
	return fr;
};

const fr1B = (i: 2, t: Team, apl: number) => {
	const a = t.stats.a[i] ?? 0;
	const e = t.stats.e[i] ?? 0;

	const fr = 0.2 * (2 * a - e) - apl * (t.stats.poTot - t.stats.soPit);
	if (Number.isNaN(fr)) {
		return 0;
	}
	return fr;
};

const fr2B = (i: 3 | 4 | 5, t: Team, apl: number) => {
	const po = t.stats.po[i] ?? 0;
	const a = t.stats.a[i] ?? 0;
	const e = t.stats.e[i] ?? 0;
	const dp = t.stats.dp[i] ?? 0;

	const fr =
		0.2 * (po + 2 * a - e + dp) - apl * (t.stats.poTot - t.stats.soPit);
	if (Number.isNaN(fr)) {
		return 0;
	}
	return fr;
};

const frLF = (i: 6 | 7 | 8, t: Team, apl: number) => {
	const po = t.stats.po[i] ?? 0;
	const a = t.stats.a[i] ?? 0;
	const e = t.stats.e[i] ?? 0;
	const dp = t.stats.dp[i] ?? 0;

	const fr =
		0.2 * (po + 4 * a - e + 2 * dp) - apl * (t.stats.poTot - t.stats.soPit);
	if (Number.isNaN(fr)) {
		return 0;
	}
	return fr;
};

const aplP = (i: 0, league: any) => {
	const apl =
		(0.1 * (league.po[i] + 2 * league.a[i] - league.e[i] + league.dp[i])) /
		(league.poTot - league.soPit);
	if (Number.isNaN(apl)) {
		return 0;
	}
	return apl;
};

const aplC = (i: 1, league: any) => {
	const apl =
		(0.2 *
			(league.po[i] -
				league.soPit +
				2 * league.a[i] -
				league.e[i] +
				league.dp[i])) /
		(league.poTot - league.soPit);
	if (Number.isNaN(apl)) {
		return 0;
	}
	return apl;
};

const apl1B = (i: 2, league: any) => {
	const apl =
		(0.2 * (2 * league.a[i] - league.e[i])) / (league.poTot - league.soPit);
	if (Number.isNaN(apl)) {
		return 0;
	}
	return apl;
};

const apl2B = (i: 3 | 4 | 5, league: any) => {
	const apl =
		(0.2 * (league.po[i] + 2 * league.a[i] - league.e[i] + league.dp[i])) /
		(league.poTot - league.soPit);
	if (Number.isNaN(apl)) {
		return 0;
	}
	return apl;
};

const aplLF = (i: 6 | 7 | 8, league: any) => {
	const apl =
		(0.2 * (league.po[i] + 4 * league.a[i] - league.e[i] + 2 * league.dp[i])) /
		(league.poTot - league.soPit);
	if (Number.isNaN(apl)) {
		return 0;
	}
	return apl;
};

// Hendela, Karl (2020) "Sabermetric Analysis: Wins-Above-Replacement," Locus: The Seton Hall Journal of Undergraduate Research: Vol. 3 , Article 7.
// Available at: https://scholarship.shu.edu/locus/vol3/iss1/7
const calculateWAR = (players: any[], teams: Team[], league: any) => {
	const rbat = []; // Batting Runs
	const rbr = []; // Baserunning Runs
	const rfld = []; // Fielding Runs
	const rpos = []; // Positional Adjustment Runs
	const rpit = []; // Pitching Runs Saved
	const raa = []; // Runs Above Average
	const waa = []; // Wins Above Average
	const rrep = []; // Runs From Replacement Level
	const rar = []; // Runs Above Replacement
	const war = []; // Wins Above Replacement

	const lgf = 1; // "league factor"

	const runsPerGame = league.pts / league.gp;

	const abf =
		(0.47 * league.h +
			0.38 * league["2b"] +
			0.55 * league["3b"] +
			0.93 * league.hr +
			0.33 * (league.bb + league.hbp)) /
		(league.ab - lgf * league.h);

	const apl = {
		P: aplP(0, league),
		C: aplC(1, league),
		"1B": apl1B(2, league),
		"2B": apl2B(3, league),
		"3B": apl2B(4, league),
		SS: apl2B(5, league),
		LF: aplLF(6, league),
		CF: aplLF(7, league),
		RF: aplLF(8, league),
	};

	const teamFieldingRuns: Record<
		number,
		{
			P: number;
			C: number;
			"1B": number;
			"2B": number;
			"3B": number;
			SS: number;
			LF: number;
			CF: number;
			RF: number;
		}
	> = {};

	for (const t of teams) {
		teamFieldingRuns[t.tid] = {
			P: frP(0, t, apl.P),
			C: frC(1, t, apl.C),
			"1B": fr1B(2, t, apl["1B"]),
			"2B": fr2B(3, t, apl["2B"]),
			"3B": fr2B(4, t, apl["3B"]),
			SS: fr2B(5, t, apl.SS),
			LF: frLF(6, t, apl.LF),
			CF: frLF(7, t, apl.CF),
			RF: frLF(8, t, apl.RF),
		};
	}
	const teamsByTid = groupByUnique(teams, "tid");

	for (let i = 0; i < players.length; i++) {
		const p = players[i];
		const t = teamsByTid[p.tid];

		// Batting Runs
		const pitcherFactor = p.stats.gpPit >= 0.75 * p.stats.gp ? 0.5 : 1;
		rbat[i] =
			0.47 * p.stats.h +
			0.38 * p.stats["2b"] +
			0.55 * p.stats["3b"] +
			0.93 * p.stats.hr +
			0.33 * (p.stats.bb + p.stats.hbp) -
			pitcherFactor * abf * (p.stats.ab - p.stats.h);

		// Baserunning Runs
		rbr[i] = 0.3 * p.stats.sb - 0.6 * p.stats.cs;

		rfld[i] = [] as number[];
		rpos[i] = 0;
		for (let j = 0; j < p.stats.gpF.length; j++) {
			const gpF = p.stats.gpF[j];
			if (gpF !== undefined && gpF > 0) {
				const pos =
					POS_NUMBERS_INVERSE[(j + 1) as keyof typeof POS_NUMBERS_INVERSE];

				// Positional Adjustment Runs
				rpos[i] +=
					(gpF / g.get("numGames")) * POSITIONAL_ADJUSTMENT_COEFFICIENTS[pos];

				// Fielding Runs
				if (pos !== "DH") {
					const po = pos === "C" ? p.stats.po[j] - p.stats.poSo : p.stats.po[j];
					if (po !== undefined && po > 0) {
						const poTeam =
							pos === "C" ? t.stats.po[j] - t.stats.soPit : t.stats.po[j];
						rfld[i][j] = (po / poTeam) * teamFieldingRuns[t.tid][pos];
					}
				}
			}
		}

		// Pitching Runs Saved
		rpit[i] = (p.stats.outs / NUM_OUTS_PER_GAME) * league.era - p.stats.er;

		// Replacement Player Adjustment
		if (p.stats.gpPit > 0) {
			rrep[i] = p.stats.bf / 50;
		} else {
			rrep[i] = p.stats.pa / 30;
		}

		raa[i] = rbat[i] + rbr[i] + helpers.sum(rfld[i]) + rpos[i] + rpit[i];

		waa[i] = raa[i] / runsPerGame;

		rar[i] = raa[i] + rrep[i];

		// Wins Above Replacement
		war[i] = rar[i] / runsPerGame;
	}

	return {
		rbat,
		rbr,
		rfld,
		rpos,
		rpit,
		raa,
		waa,
		rrep,
		rar,
		war,
	};
};

const advStats = async () => {
	const playoffs = PHASE.PLAYOFFS === g.get("phase");

	const playersRaw = await idb.cache.players.indexGetAll("playersByTid", [
		0, // Active players have tid >= 0
		Infinity,
	]);
	const players = await idb.getCopies.playersPlus(playersRaw, {
		attrs: ["pid", "tid"],
		stats: [
			"h",
			"2b",
			"3b",
			"hr",
			"bb",
			"hbp",
			"ab",
			"sb",
			"cs",
			"gpF",
			"po",
			"poSo",
			"outs",
			"er",
			"bf",
			"pa",
			"gp",
			"gpPit",
		],
		season: g.get("season"),
		playoffs,
		regularSeason: !playoffs,
	});
	const teams = await idb.getCopies.teamsPlus(
		{
			attrs: ["tid"],
			stats: teamStats,
			seasonAttrs: ["ptsDefault"],
			season: g.get("season"),
			playoffs,
			regularSeason: !playoffs,
			addDummySeason: true,
			active: true,
		},
		"noCopyCache",
	);
	const league: any = teams.reduce((memo: any, t) => {
		for (const key of teamStats) {
			if (Array.isArray(t.stats[key])) {
				if (!memo[key]) {
					memo[key] = range(9);
				}

				for (let i = 0; i < (t.stats[key] as number[]).length; i++) {
					const value = (t.stats[key] as number[])[i];
					if (value !== undefined) {
						memo[key][i] += value;
					}
				}
			} else {
				if (Object.hasOwn(memo, key)) {
					memo[key] += t.stats[key];
				} else {
					memo[key] = t.stats[key];
				}
			}
		}

		return memo;
	}, {});
	league.gp /= 2;
	league.era = helpers.ratio(league.er, league.outs / NUM_OUTS_PER_GAME);

	const updatedStats = { ...calculateWAR(players, teams, league) };
	await advStatsSave(players, playersRaw, updatedStats);
};

export default advStats;
