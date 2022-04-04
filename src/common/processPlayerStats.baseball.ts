import type { PlayerStats, PlayerStatType } from "./types";

const processStats = (
	ps: PlayerStats,
	stats: string[],
	statType?: PlayerStatType,
	bornYear?: number,
) => {
	const row: any = {};

	console.log("processStats", stats, ps.pa, ps.bb, ps.hbp, ps.sf);

	for (const stat of stats) {
		if (stat === "age") {
			if (bornYear === undefined) {
				throw new Error(
					"You must supply bornYear to processStats if you want age",
				);
			}

			row.age = ps.season - bornYear;
		} else if (stat === "keyStats") {
			row[stat] = "keyStats";
		} else if (stat === "ab") {
			row[stat] = ps.pa - ps.bb - ps.hbp - ps.sf;
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
