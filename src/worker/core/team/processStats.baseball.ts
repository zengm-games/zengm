import team from ".";
import {
	NUM_OUTS_PER_GAME,
	outsToInnings,
	sumByPos,
} from "../../../common/processPlayerStats.baseball";
import type { TeamStatAttr, TeamStats } from "../../../common/types";
import type { TeamStatAttrByPos } from "../../../common/types.baseball";
import { helpers } from "../../util";

const processStats = (
	ts: TeamStats,
	stats: Readonly<(TeamStatAttr | TeamStatAttrByPos)[]>,
	playoffs: boolean,
	// statType: TeamStatType,
) => {
	const row: any = {};

	const ab = ts.pa - ts.bb - ts.hbp - ts.sf;
	const tb = ts.h + ts["2b"] + 2 * ts["3b"] + 3 * ts.hr;
	const ba = helpers.ratio(ts.h, ab);
	const obp = helpers.ratio(ts.h + ts.bb + ts.hbp, ab + ts.bb + ts.hbp + ts.sf);
	const slg = helpers.ratio(tb, ab);

	const ip = outsToInnings(ts.outs);
	const era = helpers.ratio(ts.er, ts.outs / NUM_OUTS_PER_GAME);

	const oppAb = ts.oppPa - ts.oppBb - ts.oppHbp - ts.oppSf;
	const oppTb = ts.oppH + ts["opp2b"] + 2 * ts["opp3b"] + 3 * ts.oppHr;
	const oppBa = helpers.ratio(ts.oppH, oppAb);
	const oppObp = helpers.ratio(
		ts.oppH + ts.oppBb + ts.oppHbp,
		oppAb + ts.oppBb + ts.oppHbp + ts.oppSf,
	);
	const oppSlg = helpers.ratio(oppTb, oppAb);

	const oppIp = outsToInnings(ts.oppOuts);
	const oppEra = helpers.ratio(ts.oppEr, ts.oppOuts / NUM_OUTS_PER_GAME);

	const derivedByPosStat = (cb: (i: number) => number) =>
		[0, 1, 2, 3, 4, 5, 6, 7, 8].map(cb);

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
				row[stat] = helpers.ratio(ts.bbPit, ts.outs / NUM_OUTS_PER_GAME);
			} else if (stat === "so9") {
				row[stat] = helpers.ratio(ts.soPit, ts.outs / NUM_OUTS_PER_GAME);
			} else if (stat === "pc9") {
				row[stat] = helpers.ratio(ts.pc, ts.outs / NUM_OUTS_PER_GAME);
			} else if (stat === "sow") {
				row[stat] = helpers.ratio(ts.soPit, ts.bbPit);
			} else if (stat === "poTot") {
				row[stat] = sumByPos(ts.po);
			} else if (stat === "ch") {
				row[stat] = derivedByPosStat(
					i => (ts.po[i] ?? 0) + (ts.a[i] ?? 0) + (ts.e[i] ?? 0),
				);
			} else if (stat === "fldp") {
				row[stat] = derivedByPosStat(i =>
					helpers.ratio(
						(ts.po[i] ?? 0) + (ts.a[i] ?? 0),
						(ts.po[i] ?? 0) + (ts.a[i] ?? 0) + (ts.e[i] ?? 0),
					),
				);
			} else if (stat === "rf9") {
				row[stat] = derivedByPosStat(i =>
					helpers.ratio(
						(ts.po[i] ?? 0) + (ts.a[i] ?? 0),
						(ts.outsF[i] ?? 0) / NUM_OUTS_PER_GAME,
					),
				);
			} else if (stat === "rfg") {
				row[stat] = derivedByPosStat(i =>
					helpers.ratio((ts.po[i] ?? 0) + (ts.a[i] ?? 0), ts.gp),
				);
			} else if (stat === "csp") {
				row[stat] = helpers.percentage(ts.csF, ts.csF + ts.sbF);
			} else if (stat === "inn") {
				row[stat] = derivedByPosStat(i => outsToInnings(ts.outsF[i]));
			} else if (stat === "oppAb") {
				row[stat] = oppAb;
			} else if (stat === "oppBa") {
				row[stat] = oppBa;
			} else if (stat === "oppObp") {
				row[stat] = oppObp;
			} else if (stat === "oppSlg") {
				row[stat] = oppSlg;
			} else if (stat === "oppOps") {
				row[stat] = oppObp + oppSlg;
			} else if (stat === "oppTb") {
				row[stat] = oppTb;
			} else if (stat === "oppEra") {
				row[stat] = oppEra;
			} else if (stat === "oppIp") {
				row[stat] = oppIp;
			} else if (stat === "oppFip") {
				row[stat] =
					helpers.ratio(
						13 * ts.oppHrPit +
							3 * (ts.oppHbpPit + ts.oppBbPit) -
							2 * ts.oppSoPit,
						ts.oppOuts / 3,
					) + 3.2;
			} else if (stat === "oppWhip") {
				row[stat] = helpers.ratio(ts.oppBbPit + ts.oppHPit, ts.oppOuts / 3);
			} else if (stat === "oppH9") {
				row[stat] = helpers.ratio(ts.oppHPit, ts.oppOuts / NUM_OUTS_PER_GAME);
			} else if (stat === "oppHr9") {
				row[stat] = helpers.ratio(ts.oppHrPit, ts.oppOuts / NUM_OUTS_PER_GAME);
			} else if (stat === "oppBb9") {
				row[stat] = helpers.ratio(ts.oppSoPit, ts.oppOuts / NUM_OUTS_PER_GAME);
			} else if (stat === "oppSo9") {
				row[stat] = helpers.ratio(ts.oppSoPit, ts.oppOuts / NUM_OUTS_PER_GAME);
			} else if (stat === "oppPc9") {
				row[stat] = helpers.ratio(ts.oppPc, ts.oppOuts / NUM_OUTS_PER_GAME);
			} else if (stat === "oppSow") {
				row[stat] = helpers.ratio(ts.oppSoPit, ts.oppBbPit);
			} else if (stat === "oppCh") {
				row[stat] = derivedByPosStat(
					i => (ts.oppPo[i] ?? 0) + (ts.oppA[i] ?? 0) + (ts.oppE[i] ?? 0),
				);
			} else if (stat === "oppFldp") {
				row[stat] = derivedByPosStat(i =>
					helpers.ratio(
						(ts.oppPo[i] ?? 0) + (ts.oppA[i] ?? 0),
						(ts.oppPo[i] ?? 0) + (ts.oppA[i] ?? 0) + (ts.oppE[i] ?? 0),
					),
				);
			} else if (stat === "oppRf9") {
				row[stat] = derivedByPosStat(i =>
					helpers.ratio(
						(ts.oppPo[i] ?? 0) + (ts.oppA[i] ?? 0),
						(ts.oppOutsF[i] ?? 0) / NUM_OUTS_PER_GAME,
					),
				);
			} else if (stat === "oppRfg") {
				row[stat] = derivedByPosStat(i =>
					helpers.ratio((ts.oppPo[i] ?? 0) + (ts.oppA[i] ?? 0), ts.gp),
				);
			} else if (stat === "oppCsp") {
				row[stat] = helpers.percentage(ts.oppCsF, ts.oppCsF + ts.oppSbF);
			} else if (stat === "oppInn") {
				row[stat] = derivedByPosStat(i => outsToInnings(ts.oppOutsF[i]));
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
