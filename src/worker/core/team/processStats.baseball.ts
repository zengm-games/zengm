import team from ".";
import { NUM_OUTS_PER_GAME } from "../../../common/processPlayerStats.baseball";
import type { TeamStatAttr, TeamStats } from "../../../common/types";
import { helpers } from "../../util";

const processStats = (
	ts: TeamStats,
	stats: Readonly<TeamStatAttr[]>,
	playoffs: boolean,
	// statType: TeamStatType,
) => {
	const row: any = {};

	const ab = ts.pa - ts.bb - ts.hbp - ts.sf;
	const tb = ts.h + ts["2b"] + 2 * ts["3b"] + 3 * ts.hr;
	const ba = helpers.ratio(ts.h, ab);
	const obp = helpers.ratio(ts.h + ts.bb + ts.hbp, ab + ts.bb + ts.hbp + ts.sf);
	const slg = helpers.ratio(tb, ab);

	const completeInnings = Math.floor(ts.outs / 3);
	const fractionalInnings = ts.outs % 3;
	const ip = completeInnings + fractionalInnings / 10;
	const era = helpers.ratio(ts.er, ts.outs / NUM_OUTS_PER_GAME);

	if (ts.gp > 0) {
		for (const stat of stats) {
			if (stat === "mov") {
				if (ts.gp > 0) {
					row.mov = (ts.pts - ts.oppPts) / ts.gp;
				} else {
					row.mov = 0;
				}
			} else if (stat === "oppMov") {
				if (ts.gp > 0) {
					row.oppMov = (ts.oppPts - ts.pts) / ts.gp;
				} else {
					row.oppMov = 0;
				}
			} else if (stat === "ab") {
				row[stat] = ab;
			} else if (stat === "ba") {
				row[stat] = ba;
			} else if (stat === "obp") {
				row[stat] = obp;
			} else if (stat === "slg") {
				row[stat] = slg;
			} else if (stat === "ops") {
				row[stat] = obp + slg;
			} else if (stat === "tb") {
				row[stat] = tb;
			} else if (stat === "ip") {
				row[stat] = ip;
			} else if (stat === "winp") {
				row[stat] = helpers.ratio(ts.w, ts.w + ts.l);
			} else if (stat === "era") {
				row[stat] = era;
			} else if (stat === "fip") {
				row[stat] =
					helpers.ratio(
						13 * ts.hrPit + 3 * (ts.hbpPit + ts.bbPit) - 2 * ts.soPit,
						ts.outs / 3,
					) + 3.2;
			} else if (stat === "whip") {
				row[stat] = helpers.ratio(ts.bbPit + ts.hPit, ts.outs / 3);
			} else if (stat === "h9") {
				row[stat] = helpers.ratio(ts.hPit, ts.outs / NUM_OUTS_PER_GAME);
			} else if (stat === "hr9") {
				row[stat] = helpers.ratio(ts.hrPit, ts.outs / NUM_OUTS_PER_GAME);
			} else if (stat === "bb9") {
				row[stat] = helpers.ratio(ts.soPit, ts.outs / NUM_OUTS_PER_GAME);
			} else if (stat === "so9") {
				row[stat] = helpers.ratio(ts.soPit, ts.outs / NUM_OUTS_PER_GAME);
			} else if (stat === "pc9") {
				row[stat] = helpers.ratio(ts.pc, ts.outs / NUM_OUTS_PER_GAME);
			} else if (stat === "sow") {
				row[stat] = helpers.ratio(ts.soPit, ts.bbPit);
			} else if (stat === "poTot") {
				row[stat] = 0;
				for (let i = 0; i < ts.po.length; i++) {
					const value = ts.po[i];
					if (value !== undefined) {
						row[stat] += value;
					}
				}
			} else {
				row[stat] = ts[stat];
			}
		}
	} else {
		for (const stat of stats) {
			if (stat === "season" || stat === "playoffs") {
				row[stat] = ts[stat];
			} else if (team.stats.byPos?.includes(stat)) {
				row[stat] = [];
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
