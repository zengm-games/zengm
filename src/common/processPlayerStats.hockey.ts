import { helpers } from "./helpers.ts";
import type { PlayerStats, PlayerStatType } from "./types.ts";

type StatFunction = (
	ps: PlayerStats,
	extra: {
		a: number;
		bornYear: number | undefined;
		g: number;
	},
) => number | string | undefined;

const getKeyStatsFactory =
	(stat: "keyStats" | "keyStatsWithGoalieGP"): StatFunction =>
	(ps, { a, g }) => {
		const pts = g + a;

		let role: "skater" | "goalie" | undefined;
		if (pts > 0 && pts >= ps.sv) {
			role = "skater";
		} else if (ps.sv > 0 && ps.sv >= pts) {
			role = "goalie";
		}

		if (role === "skater") {
			return `${g} G, ${a} A, ${pts} P`;
		}

		if (role === "goalie") {
			const svPct = helpers.percentage(ps.sv, ps.sv + ps.ga);
			const gaa = helpers.ratio(ps.ga, ps.gMin / 60);

			// Show GP for goalie in some UIs, cause everything else is a rate stat
			return `${stat === "keyStatsWithGoalieGP" ? `${ps.gpGoalie} GP, ` : ""}${gaa.toFixed(2)} GAA, ${svPct?.toFixed(1)} SV%`;
		}

		return "";
	};

export const statFunctions = {
	pts: (ps, { a, g }) => g + a,
	ps: (ps) => ps.ops + ps.dps + ps.gps,
	g: (ps, { g }) => g,
	a: (ps, { a }) => a,
	sa: (ps) => ps.sv + ps.ga,
	sPct: (ps, { g }) => helpers.percentage(g, ps.s),
	svPct: (ps) => helpers.ratio(ps.sv, ps.sv + ps.ga),
	foPct: (ps) => helpers.percentage(ps.fow, ps.fow + ps.fol),
	gaa: (ps) => helpers.ratio(ps.ga, ps.gMin / 60),
	amin: (ps) => helpers.ratio(ps.min, ps.gp),
	gRec: (ps) => {
		if (ps.gW !== undefined && ps.gL !== undefined) {
			return helpers.formatRecord({
				won: ps.gW,
				lost: ps.gL,
				tied: ps.gT,
				otl: ps.gOTL,
			});
		}
		return "0-0";
	},
	age: (ps, { bornYear }) => {
		if (bornYear === undefined) {
			throw new Error(
				"You must supply bornYear to processStats if you want age",
			);
		}

		return ps.season - bornYear;
	},
	keyStats: getKeyStatsFactory("keyStats"),
	keyStatsWithGoalieGP: getKeyStatsFactory("keyStatsWithGoalieGP"),
	g60: (ps, { g }) => helpers.ratio(g, ps.min / 60),
	a60: (ps, { a }) => helpers.ratio(a, ps.min / 60),
	pts60: (ps, { a, g }) => helpers.ratio(g + a, ps.min / 60),
	s60: (ps) => helpers.ratio(ps.s, ps.min / 60),
	evG60: (ps) => helpers.ratio(ps.evG, ps.min / 60),
	evA60: (ps) => helpers.ratio(ps.evA, ps.min / 60),
	evPts60: (ps) => helpers.ratio(ps.evPts, ps.min / 60),
	ppG60: (ps) => helpers.ratio(ps.ppG, ps.min / 60),
	ppA60: (ps) => helpers.ratio(ps.ppA, ps.min / 60),
	ppPts60: (ps) => helpers.ratio(ps.ppPts, ps.min / 60),
	shG60: (ps) => helpers.ratio(ps.shG, ps.min / 60),
	shA60: (ps) => helpers.ratio(ps.shA, ps.min / 60),
	shPts60: (ps) => helpers.ratio(ps.shPts, ps.min / 60),
} satisfies Record<string, StatFunction>;

export const processStats = (
	ps: PlayerStats,
	stats: Iterable<string>,
	statType?: PlayerStatType,
	bornYear?: number,
) => {
	const row: any = {};

	const g = ps.evG + ps.ppG + ps.shG;
	const a = ps.evA + ps.ppA + ps.shA;

	const statFunctions2 = statFunctions as Record<string, StatFunction>;
	const extra = { a, bornYear, g };

	for (const stat of stats) {
		if (statFunctions2[stat]) {
			row[stat] = statFunctions2[stat](ps, extra);
		} else {
			row[stat] = ps[stat];
		}

		// For keepWithNoStats
		if (
			(row[stat] === undefined || Number.isNaN(row[stat])) &&
			stat !== "jerseyNumber"
		) {
			row[stat] = 0;
		}
	}

	// Since they come in same stream, always need to be able to distinguish
	row.playoffs = ps.playoffs;

	// Always pass through hasTot
	if (ps.hasTot) {
		row.hasTot = ps.hasTot;
	}

	return row;
};
