import type { TeamStatAttr, TeamStats } from "../../../common/types";

const ratio = (numerator: number, denominator: number) => {
	if (denominator > 0) {
		return numerator / denominator;
	}

	return 0;
};

const percentage = (numerator: number, denominator: number) => {
	return 100 * ratio(numerator, denominator);
};

const processStats = (
	ts: TeamStats,
	stats: Readonly<TeamStatAttr[]>,
	playoffs: boolean,
	// statType: TeamStatType,
) => {
	const row: any = {};

	const g = ts.evG + ts.ppG + ts.shG;
	const a = ts.evA + ts.ppA + ts.shA;
	const oppG = ts.oppEvG + ts.oppPpG + ts.oppShG;
	const oppA = ts.oppEvA + ts.oppPpA + ts.oppShA;

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
			} else if (stat === "g") {
				row[stat] = g;
			} else if (stat === "a") {
				row[stat] = a;
			} else if (stat === "sa") {
				row[stat] = ts.sv + oppG;
			} else if (stat === "sPct") {
				row[stat] = percentage(g, ts.s);
			} else if (stat === "svPct") {
				row[stat] = ratio(ts.sv, ts.sv + oppG);
			} else if (stat === "foPct") {
				row[stat] = percentage(ts.fow, ts.fow + ts.fol);
			} else if (stat === "ppPct") {
				row[stat] = percentage(ts.ppG, ts.ppo);
			} else if (stat === "gaa") {
				row[stat] = ratio(oppG, ts.gp);
			} else if (stat === "oppG") {
				row[stat] = oppG;
			} else if (stat === "oppA") {
				row[stat] = oppA;
			} else if (stat === "oppAa") {
				row[stat] = ts.oppSv + g;
			} else if (stat === "oppSPct") {
				row[stat] = percentage(oppG, ts.oppS);
			} else if (stat === "oppSvPct") {
				row[stat] = ratio(ts.oppSv, ts.oppSv + oppG);
			} else if (stat === "oppFoPct") {
				row[stat] = percentage(ts.oppFow, ts.oppFow + ts.oppFol);
			} else if (stat === "oppPpPct") {
				row[stat] = percentage(ts.oppPpG, ts.oppPpo);
			} else if (stat === "oppGaa") {
				row[stat] = ratio(g, ts.gp);
			} else {
				row[stat] = ts[stat];
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
