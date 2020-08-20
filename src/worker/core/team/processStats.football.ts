import type { TeamStatAttr, TeamStats } from "../../../common/types";

const percentage = (numerator: number, denominator: number) => {
	if (denominator > 0) {
		return (100 * numerator) / denominator;
	}

	return 0;
};

const processStats = (
	ts: TeamStats,
	stats: Readonly<TeamStatAttr[]>,
	playoffs: boolean,
	// statType: TeamStatType,
) => {
	const row: any = {};

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
			} else if (stat === "ptsPerGame") {
				row[stat] = ts.pts / ts.gp;
			} else if (stat === "oppPtsPerGame") {
				row[stat] = ts.oppPts / ts.gp;
			} else if (stat === "pssYdsPerGame") {
				row[stat] = ts.pssYds / ts.gp;
			} else if (stat === "rusYdsPerGame") {
				row[stat] = ts.rusYds / ts.gp;
			} else if (stat === "yds") {
				row[stat] = ts.pssYds + ts.rusYds;
			} else if (stat === "ydsPerPlay") {
				row[stat] = (ts.pssYds + ts.rusYds) / (ts.pss + ts.rus + ts.pssSk);
			} else if (stat === "tov") {
				row[stat] = ts.fmbLost + ts.pssInt;
			} else if (stat === "pssNetYdsPerAtt") {
				row[stat] = (ts.pssYds - ts.pssSkYds) / (ts.pss + ts.pssSk);
			} else if (stat === "rusYdsPerAtt") {
				row[stat] = ts.rusYds / ts.rus;
			} else if (stat === "ply") {
				row[stat] = ts.pss + ts.rus + ts.pssSk;
			} else if (stat === "drivesScoringPct") {
				row[stat] = percentage(ts.pssTD + ts.rusTD, ts.drives);
			} else if (stat === "drivesTurnoverPct") {
				row[stat] = percentage(ts.fmbLost + ts.pssInt, ts.drives);
			} else if (stat === "avgFieldPosition") {
				row[stat] = ts.totStartYds / ts.drives;
			} else if (stat === "timePerDrive") {
				row[stat] = ts.timePos / ts.drives;
			} else if (stat === "playsPerDrive") {
				row[stat] = (ts.pss + ts.rus + ts.pssSk) / ts.drives;
			} else if (stat === "ydsPerDrive") {
				row[stat] = (ts.pssYds + ts.rusYds) / ts.drives;
			} else if (stat === "ptsPerDrive") {
				row[stat] = ts.pts / ts.drives;
			} else if (stat === "oppYds") {
				row[stat] = ts.oppPssYds + ts.oppRusYds;
			} else if (stat === "oppYdsPerPlay") {
				row[stat] =
					(ts.oppPssYds + ts.oppRusYds) / (ts.oppPss + ts.oppRus + ts.oppPssSk);
			} else if (stat === "oppTov") {
				row[stat] = ts.oppFmbLost + ts.oppPssInt;
			} else if (stat === "oppPssNetYdsPerAtt") {
				row[stat] = (ts.oppPssYds - ts.oppPssSkYds) / (ts.oppPss + ts.oppPssSk);
			} else if (stat === "oppRusYdsPerAtt") {
				row[stat] = ts.oppRusYds / ts.oppRus;
			} else if (stat === "oppPly") {
				row[stat] = ts.oppPss + ts.oppRus + ts.oppPssSk;
			} else if (stat === "oppDrivesScoringPct") {
				row[stat] = percentage(ts.oppPssTD + ts.oppRusTD, ts.oppDrives);
			} else if (stat === "oppDrivesTurnoverPct") {
				row[stat] = percentage(ts.oppFmbLost + ts.oppPssInt, ts.oppDrives);
			} else if (stat === "oppAvgFieldPosition") {
				row[stat] = ts.oppTotStartYds / ts.oppDrives;
			} else if (stat === "oppTimePerDrive") {
				row[stat] = ts.oppTimePos / ts.oppDrives;
			} else if (stat === "oppPlaysPerDrive") {
				row[stat] = (ts.oppPss + ts.oppRus + ts.oppPssSk) / ts.oppDrives;
			} else if (stat === "oppYdsPerDrive") {
				row[stat] = (ts.oppPssYds + ts.oppRusYds) / ts.oppDrives;
			} else if (stat === "oppPtsPerDrive") {
				row[stat] = ts.oppPts / ts.oppDrives;
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
	row.playoffs = ts.playoffs !== undefined ? ts.playoffs : playoffs;
	return row;
};

export default processStats;
