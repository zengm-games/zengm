import { helpers } from "./helpers.ts";
import type { PlayerStats, PlayerStatType } from "./types.ts";

export type StatSumsExtra = Record<
	string,
	{ gp: number | undefined; min: number | undefined } | undefined
>;

const straightThrough = new Set([
	"gp",
	"gs",
	"per",
	"ewa",
	"obpm",
	"dbpm",
	"vorp",
	"yearsWithTeam",
	"astp",
	"blkp",
	"drbp",
	"orbp",
	"stlp",
	"trbp",
	"usgp",
	"drtg",
	"ortg",
	"dws",
	"ows",
	"dd",
	"td",
	"qd",
	"fxf",
	"pm100",
	"onOff100",
	"jerseyNumber",
	"season",
]);

type StatFunction = {
	process: (
		ps: PlayerStats,
		bornYear: number | undefined,
	) => number | undefined;
	scale: boolean;
};

// `tp ?? 0` ones are because in historical stats, tp may be undefined, but fg never is
export const statFunctions = {
	"2pp": {
		process: (ps) =>
			helpers.percentage(ps.fg - (ps.tp ?? 0), ps.fga - (ps.tpa ?? 0)),
		scale: false,
	},
	fgp: {
		process: (ps) => helpers.percentage(ps.fg, ps.fga),
		scale: false,
	},
	efg: {
		process: (ps) => helpers.percentage(ps.fg + 0.5 * (ps.tp ?? 0), ps.fga),
		scale: false,
	},
	fgpAtRim: {
		process: (ps) => helpers.percentage(ps.fgAtRim, ps.fgaAtRim),
		scale: false,
	},
	fgpLowPost: {
		process: (ps) => helpers.percentage(ps.fgLowPost, ps.fgaLowPost),
		scale: false,
	},
	fgpMidRange: {
		process: (ps) => helpers.percentage(ps.fgMidRange, ps.fgaMidRange),
		scale: false,
	},
	tpp: {
		process: (ps) => helpers.percentage(ps.tp, ps.tpa),
		scale: false,
	},
	ftp: {
		process: (ps) => helpers.percentage(ps.ft, ps.fta),
		scale: false,
	},
	tsp: {
		process: (ps) => helpers.percentage(ps.pts, 2 * (ps.fga + 0.44 * ps.fta)),
		scale: false,
	},
	tpar: {
		process: (ps) => helpers.ratio(ps.tpa, ps.fga),
		scale: false,
	},
	ftr: {
		process: (ps) => helpers.ratio(ps.fta, ps.fga),
		scale: false,
	},
	"2p": {
		process: (ps) => ps.fg - (ps.tp ?? 0),
		scale: true,
	},
	"2pa": {
		process: (ps) => ps.fga - (ps.tpa ?? 0),
		scale: true,
	},
	tovp: {
		process: (ps) =>
			ps.tovp ?? helpers.percentage(ps.tov, ps.fga + 0.44 * ps.fta + ps.tov),
		scale: false,
	},
	age: {
		process: (ps, bornYear) => {
			if (bornYear === undefined) {
				throw new Error(
					"You must supply bornYear to processStats if you want age",
				);
			}

			return ps.season - bornYear;
		},
		scale: false,
	},
	ws: {
		process: (ps) => ps.dws + ps.ows,
		scale: false,
	},
	ws48: {
		process: (ps) => ((ps.dws + ps.ows) * 48) / ps.min,
		scale: false,
	},
	bpm: {
		process: (ps) => ps.dbpm + ps.obpm,
		scale: false,
	},
	trb: {
		process: (ps) => {
			// In historical stats, before orb/drb were tracked separately, stats rows include trb. Even older seasons, trb was not even tracked
			if (ps.trb !== undefined || ps.drb !== undefined) {
				return (ps.trb ?? 0) + (ps.drb ?? 0) + (ps.orb ?? 0);
			}
		},
		scale: true,
	},
	gmsc: {
		process: (ps) => helpers.gameScore(ps),
		scale: false,
	},
} satisfies Record<string, StatFunction>;

export const processStats = (
	ps: PlayerStats,
	stats: Iterable<string>,
	statType: PlayerStatType = "totals",
	bornYear?: number,
	keepWithNoStats?: boolean,
	statSumsExtra?: StatSumsExtra,
) => {
	const row: any = {};

	// This is how we identify if we should fill in a missing value with 0 - don't want to do it for "null" historical data where there is a partial record! 2 rather than 0 to account for jerseyNumber and yearsWithTeam. Would be better to explicitly note somewhere what type of row this is - real stats row with stats, individual stats row with no stats (maybe just jerseyNumber or yearsWithTeam added from playersPlus), or completely empty row to fill in career stats
	const hasSomeData = Object.keys(ps).length > 2;

	const statFunctions2 = statFunctions as Record<string, StatFunction>;

	for (const stat of stats) {
		let scale = true;
		if (straightThrough.has(stat) || stat.endsWith("Max")) {
			row[stat] = ps[stat];
			scale = false;
		} else if (statFunctions2[stat]) {
			row[stat] = statFunctions2[stat].process(ps, bornYear);
			scale = statFunctions2[stat].scale;
		} else {
			row[stat] = ps[stat];
		}

		if (scale) {
			// Either the raw stat from database, or something added up above (trb, 2p, 2pa)
			const val = row[stat] ?? ps[stat];
			if (val !== undefined) {
				if (statType === "totals") {
					row[stat] = val;
				} else if (statType === "per36" && stat !== "min") {
					const min = statSumsExtra?.[stat]?.min ?? ps.min;
					row[stat] =
						min > 0 && min !== undefined ? (val * 36) / min : undefined;
				} else {
					let gp;
					if (stat === "trb" && statSumsExtra?.trb?.gp !== undefined) {
						gp = statSumsExtra.trb.gp + (statSumsExtra.drb?.gp ?? 0);
					} else {
						gp = statSumsExtra?.[stat]?.gp ?? ps.gp;
					}
					row[stat] = gp > 0 && gp !== undefined ? val / gp : 0;
				}
			}
		}

		if (
			!hasSomeData &&
			keepWithNoStats &&
			(row[stat] === undefined || Number.isNaN(row[stat])) &&
			stat !== "jerseyNumber"
		) {
			row[stat] = 0;
		}

		if (Number.isNaN(row[stat])) {
			row[stat] = undefined;
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
