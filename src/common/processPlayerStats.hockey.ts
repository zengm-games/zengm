import helpers from "./helpers";
import type { PlayerStats, PlayerStatType } from "./types";

const percentage = (numerator: number, denominator: number) => {
	if (denominator > 0) {
		return (100 * numerator) / denominator;
	}

	return 0;
};

const qbRat = (ps: PlayerStats) => {
	const a = helpers.bound((ps.pssCmp / ps.pss - 0.3) * 5, 0, 2.375);
	const b = helpers.bound((ps.pssYds / ps.pss - 3) * 0.25, 0, 2.375);
	const c = helpers.bound((ps.pssTD / ps.pss) * 20, 0, 2.375);
	const d = helpers.bound(2.375 - (ps.pssInt / ps.pss) * 25, 0, 2.375);
	return ((a + b + c + d) / 6) * 100;
};

const processStats = (
	ps: PlayerStats,
	stats: string[],
	statType?: PlayerStatType,
	bornYear?: number,
) => {
	const row: any = {};

	for (const stat of stats) {
		if (stat === "pts") {
			row[stat] =
				ps.evG + ps.ppG + ps.shG + ps.gwG + ps.evA + ps.ppA + ps.shA + ps.gwA;
		} else if (stat === "g") {
			row[stat] = ps.evG + ps.ppG + ps.shG + ps.gwG;
		} else if (stat === "a") {
			row[stat] = ps.evA + ps.ppA + ps.shA + ps.gwA;
		} else if (stat === "sPct") {
			row[stat] = percentage(ps.evG + ps.ppG + ps.shG + ps.gwG, ps.s);
		} else if (stat === "svPct") {
			row[stat] = percentage(ps.sv, ps.sv + ps.ga);
		} else if (stat === "age") {
			if (bornYear === undefined) {
				throw new Error(
					"You must supply bornYear to processStats if you want age",
				);
			}

			row.age = ps.season - bornYear;
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
	return row;
};

export default processStats;
