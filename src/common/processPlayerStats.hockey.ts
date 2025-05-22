import helpers from "./helpers.ts";
import type { PlayerStats, PlayerStatType } from "./types.ts";

const processStats = (
	ps: PlayerStats,
	stats: string[],
	statType?: PlayerStatType,
	bornYear?: number,
) => {
	const row: any = {};

	const g = ps.evG + ps.ppG + ps.shG;
	const a = ps.evA + ps.ppA + ps.shA;

	for (const stat of stats) {
		if (stat === "pts") {
			row[stat] = g + a;
		} else if (stat === "ps") {
			row[stat] = ps.ops + ps.dps + ps.gps;
		} else if (stat === "g") {
			row[stat] = g;
		} else if (stat === "a") {
			row[stat] = a;
		} else if (stat === "sa") {
			row[stat] = ps.sv + ps.ga;
		} else if (stat === "sPct") {
			row[stat] = helpers.percentage(g, ps.s);
		} else if (stat === "svPct") {
			row[stat] = helpers.ratio(ps.sv, ps.sv + ps.ga);
		} else if (stat === "foPct") {
			row[stat] = helpers.percentage(ps.fow, ps.fow + ps.fol);
		} else if (stat === "gaa") {
			row[stat] = helpers.ratio(ps.ga, ps.gMin / 60);
		} else if (stat === "amin") {
			row[stat] = helpers.ratio(ps.min, ps.gp);
		} else if (stat === "gRec") {
			if (ps.gW !== undefined && ps.gL !== undefined) {
				row[stat] = helpers.formatRecord({
					won: ps.gW,
					lost: ps.gL,
					tied: ps.gT,
					otl: ps.gOTL,
				});
			} else {
				row[stat] = "0-0";
			}
		} else if (stat === "age") {
			if (bornYear === undefined) {
				throw new Error(
					"You must supply bornYear to processStats if you want age",
				);
			}

			row.age = ps.season - bornYear;
		} else if (stat === "keyStats" || stat === "keyStatsWithGoalieGP") {
			const pts = g + a;

			let role: "skater" | "goalie" | undefined;
			if (pts > 0 && pts >= ps.sv) {
				role = "skater";
			} else if (ps.sv > 0 && ps.sv >= pts) {
				role = "goalie";
			}

			if (role === "skater") {
				row[stat] = `${g} G, ${a} A, ${pts} P`;
			} else if (role === "goalie") {
				const svPct = helpers.percentage(ps.sv, ps.sv + ps.ga);
				const gaa = helpers.ratio(ps.ga, ps.gMin / 60);

				// Show GP for goalie in some UIs, cause everything else is a rate stat
				row[stat] =
					`${stat === "keyStatsWithGoalieGP" ? `${ps.gpGoalie} GP, ` : ""}${gaa.toFixed(2)} GAA, ${svPct?.toFixed(1)} SV%`;
			} else {
				row[stat] = "";
			}
		} else if (stat === "g60") {
			row[stat] = helpers.ratio(g, ps.min / 60);
		} else if (stat === "a60") {
			row[stat] = helpers.ratio(a, ps.min / 60);
		} else if (stat === "pts60") {
			row[stat] = helpers.ratio(g + a, ps.min / 60);
		} else if (stat === "s60") {
			row[stat] = helpers.ratio(ps.s, ps.min / 60);
		} else if (stat === "evG60") {
			row[stat] = helpers.ratio(ps.evG, ps.min / 60);
		} else if (stat === "evA60") {
			row[stat] = helpers.ratio(ps.evA, ps.min / 60);
		} else if (stat === "evPts60") {
			row[stat] = helpers.ratio(ps.evPts, ps.min / 60);
		} else if (stat === "ppG60") {
			row[stat] = helpers.ratio(ps.ppG, ps.min / 60);
		} else if (stat === "ppA60") {
			row[stat] = helpers.ratio(ps.ppA, ps.min / 60);
		} else if (stat === "ppPts60") {
			row[stat] = helpers.ratio(ps.ppPts, ps.min / 60);
		} else if (stat === "shG60") {
			row[stat] = helpers.ratio(ps.shG, ps.min / 60);
		} else if (stat === "shA60") {
			row[stat] = helpers.ratio(ps.shA, ps.min / 60);
		} else if (stat === "shPts60") {
			row[stat] = helpers.ratio(ps.shPts, ps.min / 60);
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

export default processStats;
