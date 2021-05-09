import { g, helpers } from "../../util";
import type {
	TeamStatAttr,
	TeamStatType,
	TeamStats,
} from "../../../common/types";

// Possessions estimate, from https://www.basketball-reference.com/about/glossary.html#poss
const poss = (ts: TeamStats) => {
	if (ts.orb + ts.oppDrb > 0 && ts.oppOrb + ts.drb > 0) {
		return (
			0.5 *
			(ts.fga +
				0.4 * ts.fta -
				1.07 * (ts.orb / (ts.orb + ts.oppDrb)) * (ts.fga - ts.fg) +
				ts.tov +
				(ts.oppFga +
					0.4 * ts.oppFta -
					1.07 * (ts.oppOrb / (ts.oppOrb + ts.drb)) * (ts.oppFga - ts.oppFg) +
					ts.oppTov))
		);
	}

	return 0;
};

const processStats = (
	ts: TeamStats,
	stats: Readonly<TeamStatAttr[]>,
	playoffs: boolean,
	statType: TeamStatType,
) => {
	const row: any = {};

	if (ts.gp > 0) {
		for (const stat of stats) {
			let scale = true;
			if (stat === "gp") {
				row.gp = ts.gp;
				scale = false;
			} else if (stat === "fgp") {
				row[stat] = helpers.percentage(ts.fg, ts.fga);
				scale = false;
			} else if (stat === "oppFgp") {
				row[stat] = helpers.percentage(ts.oppFg, ts.oppFga);
				scale = false;
			} else if (stat === "fgpAtRim") {
				row[stat] = helpers.percentage(ts.fgAtRim, ts.fgaAtRim);
				scale = false;
			} else if (stat === "oppFgpAtRim") {
				row[stat] = helpers.percentage(ts.oppFgAtRim, ts.oppFgaAtRim);
				scale = false;
			} else if (stat === "fgpLowPost") {
				row[stat] = helpers.percentage(ts.fgLowPost, ts.fgaLowPost);
				scale = false;
			} else if (stat === "oppFgpLowPost") {
				row[stat] = helpers.percentage(ts.oppFgLowPost, ts.oppFgaLowPost);
				scale = false;
			} else if (stat === "fgpMidRange") {
				row[stat] = helpers.percentage(ts.fgMidRange, ts.fgaMidRange);
				scale = false;
			} else if (stat === "oppFgpMidRange") {
				row[stat] = helpers.percentage(ts.oppFgMidRange, ts.oppFgaMidRange);
				scale = false;
			} else if (stat === "2pp") {
				row[stat] = helpers.percentage(ts.fg - ts.tp, ts.fga - ts.tpa);
				scale = false;
			} else if (stat === "opp2pp") {
				row[stat] = helpers.percentage(
					ts.oppFg - ts.oppTp,
					ts.oppFga - ts.oppTpa,
				);
				scale = false;
			} else if (stat === "tpp") {
				row[stat] = helpers.percentage(ts.tp, ts.tpa);
				scale = false;
			} else if (stat === "oppTpp") {
				row[stat] = helpers.percentage(ts.oppTp, ts.oppTpa);
				scale = false;
			} else if (stat === "ftp") {
				row[stat] = helpers.percentage(ts.ft, ts.fta);
				scale = false;
			} else if (stat === "oppFtp") {
				row[stat] = helpers.percentage(ts.oppFt, ts.oppFta);
				scale = false;
			} else if (stat === "mov") {
				if (statType === "totals") {
					row.mov = ts.pts - ts.oppPts;
				} else if (ts.gp > 0) {
					row.mov = (ts.pts - ts.oppPts) / ts.gp;
				} else {
					row.mov = 0;
				}
				scale = false;
			} else if (stat === "oppMov") {
				if (statType === "totals") {
					row.oppMov = ts.oppPts - ts.pts;
				} else if (ts.gp > 0) {
					row.oppMov = (ts.oppPts - ts.pts) / ts.gp;
				} else {
					row.oppMov = 0;
				}
				scale = false;
			} else if (stat === "pw") {
				if (ts.pts > 0 || ts.oppPts > 0) {
					row.pw = ts.gp * (ts.pts ** 14 / (ts.pts ** 14 + ts.oppPts ** 14));
				} else {
					row.pw = 0;
				}
				scale = false;
			} else if (stat === "pl") {
				if (ts.pts > 0 || ts.oppPts > 0) {
					row.pl =
						ts.gp - ts.gp * (ts.pts ** 14 / (ts.pts ** 14 + ts.oppPts ** 14));
				} else {
					row.pl = 0;
				}
				scale = false;
			} else if (stat === "ortg") {
				const possessions = poss(ts);
				row[stat] = helpers.percentage(ts.pts, possessions);
				scale = false;
			} else if (stat === "drtg") {
				const possessions = poss(ts);
				row[stat] = helpers.percentage(ts.oppPts, possessions);
				scale = false;
			} else if (stat === "nrtg") {
				const possessions = poss(ts);
				row[stat] = helpers.percentage(ts.pts - ts.oppPts, possessions);
				scale = false;
			} else if (stat === "pace") {
				if (ts.min > 0) {
					row.pace =
						(g.get("quarterLength") * g.get("numPeriods") * poss(ts)) /
						(ts.min / 5);
				} else {
					row.pace = 0;
				}
				scale = false;
			} else if (stat === "poss") {
				row.poss = poss(ts);
				scale = false;
			} else if (stat === "tpar") {
				row[stat] = helpers.percentage(ts.tpa, ts.fga);
				scale = false;
			} else if (stat === "ftr") {
				row[stat] = helpers.percentage(ts.fta, ts.fga);
				scale = false;
			} else if (stat === "tsp") {
				row[stat] = helpers.percentage(ts.pts, 2 * (ts.fga + 0.44 * ts.fta));
				scale = false;
			} else if (stat === "efg") {
				row[stat] = helpers.percentage(ts.fg + 0.5 * ts.tp, ts.fga);
				scale = false;
			} else if (stat === "tovp") {
				row[stat] = helpers.percentage(ts.tov, ts.fga + 0.44 * ts.fta + ts.tov);
				scale = false;
			} else if (stat === "orbp") {
				row[stat] = helpers.percentage(ts.orb, ts.orb + ts.oppDrb);
				scale = false;
			} else if (stat === "ftpFga") {
				row[stat] = ts.ft / ts.fga;
				scale = false;
			} else if (
				stat === "season" ||
				stat === "playoffs" ||
				stat === "dd" ||
				stat === "td" ||
				stat === "qd" ||
				stat === "fxf" ||
				stat === "oppDd" ||
				stat === "oppTd" ||
				stat === "oppQd" ||
				stat === "oppFxf"
			) {
				row[stat] = ts[stat];
				scale = false;
			} else if (stat === "trb") {
				row.trb = ts.drb + ts.orb;
			} else if (stat === "oppTrb") {
				row.oppTrb = ts.oppDrb + ts.oppOrb;
			} else if (stat === "2p") {
				row[stat] = ts.fg - ts.tp;
			} else if (stat === "opp2p") {
				row[stat] = ts.oppFg - ts.oppTp;
			} else if (stat === "2pa") {
				row[stat] = ts.fga - ts.tpa;
			} else if (stat === "opp2pa") {
				row[stat] = ts.oppFga - ts.oppTpa;
			} else {
				row[stat] = ts[stat];
			}

			if (scale) {
				// Either the raw stat from database, or something added up above (trb, 2p, 2pa)
				const val = row[stat] ?? ts[stat];
				if (statType === "totals") {
					row[stat] = val;
				} else {
					row[stat] = val / ts.gp;
				}
			}
		}
	} else {
		for (const stat of stats) {
			if (stat === "season" || stat === "playoffs") {
				row[stat] = ts[stat];
			} else {
				row[stat] = 0;
			}
		}
	}

	// Since they come in same stream, always need to be able to distinguish
	row.playoffs = ts.playoffs ?? playoffs;
	return row;
};

export default processStats;
