import helpers from "./helpers.ts";
import type { PlayerStats, PlayerStatType } from "./types.ts";

export type StatSumsExtra = Record<
	string,
	{ gp: number | undefined; min: number | undefined } | undefined
>;

const straightThrough = [
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
];

const processStats = (
	ps: PlayerStats,
	stats: string[],
	statType: PlayerStatType = "totals",
	bornYear?: number,
	keepWithNoStats?: boolean,
	statSumsExtra?: StatSumsExtra,
) => {
	const row: any = {};

	for (const stat of stats) {
		let scale = true;
		if (straightThrough.includes(stat)) {
			row[stat] = ps[stat];
			scale = false;
		} else if (stat === "2pp") {
			// In historical stats, tp may be undefined, but fg never is
			row[stat] = helpers.percentage(
				ps.fg - (ps.tp ?? 0),
				ps.fga - (ps.tpa ?? 0),
			);
			scale = false;
		} else if (stat === "fgp") {
			row[stat] = helpers.percentage(ps.fg, ps.fga);
			scale = false;
		} else if (stat === "efg") {
			// In historical stats, tp may be undefined, but fg never is
			row[stat] = helpers.percentage(ps.fg + 0.5 * (ps.tp ?? 0), ps.fga);
			scale = false;
		} else if (stat === "fgpAtRim") {
			row[stat] = helpers.percentage(ps.fgAtRim, ps.fgaAtRim);
			scale = false;
		} else if (stat === "fgpLowPost") {
			row[stat] = helpers.percentage(ps.fgLowPost, ps.fgaLowPost);
			scale = false;
		} else if (stat === "fgpMidRange") {
			row[stat] = helpers.percentage(ps.fgMidRange, ps.fgaMidRange);
			scale = false;
		} else if (stat === "tpp") {
			row[stat] = helpers.percentage(ps.tp, ps.tpa);
			scale = false;
		} else if (stat === "ftp") {
			row[stat] = helpers.percentage(ps.ft, ps.fta);
			scale = false;
		} else if (stat === "tsp") {
			row[stat] = helpers.percentage(ps.pts, 2 * (ps.fga + 0.44 * ps.fta));
			scale = false;
		} else if (stat === "tpar") {
			row[stat] = helpers.ratio(ps.tpa, ps.fga);
			scale = false;
		} else if (stat === "ftr") {
			row[stat] = helpers.ratio(ps.fta, ps.fga);
			scale = false;
		} else if (stat === "tovp") {
			row[stat] =
				ps.tovp ?? helpers.percentage(ps.tov, ps.fga + 0.44 * ps.fta + ps.tov);
			scale = false;
		} else if (stat === "season") {
			row.season = ps.season;
			scale = false;
		} else if (stat === "age") {
			if (bornYear === undefined) {
				throw new Error(
					"You must supply bornYear to processStats if you want age",
				);
			}

			row.age = ps.season - bornYear;
			scale = false;
		} else if (stat === "ws") {
			row.ws = ps.dws + ps.ows;
			scale = false;
		} else if (stat === "ws48") {
			row.ws48 = ((ps.dws + ps.ows) * 48) / ps.min;
			scale = false;
		} else if (stat === "bpm") {
			row.bpm = ps.dbpm + ps.obpm;
			scale = false;
		} else if (stat === "trb") {
			// In historical stats, before orb/drb were tracked separately, stats rows include trb. Even older seasons, trb was not even tracked
			if (ps.trb !== undefined || ps.drb !== undefined) {
				row[stat] = (ps.trb ?? 0) + (ps.drb ?? 0) + (ps.orb ?? 0);
			}
		} else if (stat === "2p") {
			// In historical stats, tp may be undefined, but fg never is
			row[stat] = ps.fg - (ps.tp ?? 0);
		} else if (stat === "2pa") {
			// In historical stats, tp may be undefined, but fg never is
			row[stat] = ps.fga - (ps.tpa ?? 0);
		} else if (stat === "jerseyNumber") {
			row[stat] = ps[stat];
			scale = false;
		} else if (stat === "gmsc") {
			row[stat] = helpers.gameScore(ps);
			scale = false;
		} else if (stat.endsWith("Max")) {
			row[stat] = ps[stat];
			scale = false;
		} else {
			row[stat] = ps[stat];
		}

		if (scale) {
			// Either the raw stat from database, or something added up above (trb, 2p, 2pa)
			const val = row[stat] ?? ps[stat];
			if (statType === "totals") {
				row[stat] = val;
			} else if (statType === "per36" && stat !== "min") {
				const min = statSumsExtra?.[stat]?.min ?? ps.min;
				row[stat] = min > 0 ? (val * 36) / min : undefined;
			} else {
				let gp;
				if (stat === "trb" && statSumsExtra?.trb?.gp !== undefined) {
					gp = statSumsExtra.trb.gp + (statSumsExtra.drb?.gp ?? 0);
				} else {
					gp = statSumsExtra?.[stat]?.gp ?? ps.gp;
				}
				row[stat] = gp > 0 ? val / gp : 0;
			}
		}

		if (
			keepWithNoStats &&
			(row[stat] === undefined || Number.isNaN(row[stat])) &&
			stat !== "jerseyNumber"
		) {
			row[stat] = 0;
		}

		if (!keepWithNoStats && Number.isNaN(row[stat])) {
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

export default processStats;
