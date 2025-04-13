import { qbRat } from "../../../common/processPlayerStats.football.ts";
import type { TeamStatAttr, TeamStats } from "../../../common/types.ts";
import { helpers } from "../../util/index.ts";

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
				row[stat] = helpers.percentage(ts.pssTD + ts.rusTD, ts.drives);
			} else if (stat === "drivesTurnoverPct") {
				row[stat] = helpers.percentage(ts.fmbLost + ts.pssInt, ts.drives);
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
			} else if (stat === "cmpPct") {
				row[stat] = helpers.percentage(ts.pssCmp, ts.pss);
			} else if (stat === "qbRat") {
				row[stat] = qbRat(ts);
			} else if (stat === "pssTDPct") {
				row[stat] = helpers.percentage(ts.pssTD, ts.pss);
			} else if (stat === "pssIntPct") {
				row[stat] = helpers.percentage(ts.pssInt, ts.pss);
			} else if (stat === "pssYdsPerAtt") {
				row[stat] = ts.pssYds / ts.pss;
			} else if (stat === "pssAdjYdsPerAtt") {
				row[stat] = (ts.pssYds + 20 * ts.pssTD - 45 * ts.pssInt) / ts.pss;
			} else if (stat === "pssYdsPerCmp") {
				row[stat] = ts.pssYds / ts.pssCmp;
			} else if (stat === "pssAdjNetYdsPerAtt") {
				row[stat] =
					(ts.pssYds + 20 * ts.pssTD - 45 * ts.pssInt - ts.pssSkYds) /
					(ts.pss + ts.pssSk);
			} else if (stat === "pssSkPct") {
				row[stat] = helpers.percentage(ts.pssSk, ts.pssSk + ts.pss);
			} else if (stat === "rusPerGame") {
				row[stat] = ts.rus / ts.gp;
			} else if (stat === "defTck") {
				row[stat] = ts.defTckSolo + ts.defTckAst;
			} else if (stat === "fg") {
				row[stat] = ts.fg0 + ts.fg20 + ts.fg30 + ts.fg40 + ts.fg50;
			} else if (stat === "fga") {
				row[stat] = ts.fga0 + ts.fga20 + ts.fga30 + ts.fga40 + ts.fga50;
			} else if (stat === "fgPct") {
				row[stat] = helpers.percentage(
					ts.fg0 + ts.fg20 + ts.fg30 + ts.fg40 + ts.fg50,
					ts.fga0 + ts.fga20 + ts.fga30 + ts.fga40 + ts.fga50,
				);
			} else if (stat === "xpPct") {
				row[stat] = helpers.percentage(ts.xp, ts.xpa);
			} else if (stat === "kickingPts") {
				row[stat] =
					3 * (ts.fg0 + ts.fg20 + ts.fg30 + ts.fg40 + ts.fg50) + ts.xp;
			} else if (stat === "pntYdsPerAtt") {
				row[stat] = ts.pntYds / ts.pnt;
			} else if (stat === "prYdsPerAtt") {
				row[stat] = ts.prYds / ts.pr;
			} else if (stat === "krYdsPerAtt") {
				row[stat] = ts.krYds / ts.kr;
			} else if (stat === "allPurposeYds") {
				row[stat] =
					ts.rusYds +
					ts.recYds +
					ts.prYds +
					ts.krYds +
					ts.defIntYds +
					ts.defFmbYds;
			} else if (stat === "allTD") {
				row[stat] =
					ts.rusTD + ts.recTD + ts.prTD + ts.krTD + ts.defFmbTD + ts.defIntTD;
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
				row[stat] = helpers.percentage(ts.oppPssTD + ts.oppRusTD, ts.oppDrives);
			} else if (stat === "oppDrivesTurnoverPct") {
				row[stat] = helpers.percentage(
					ts.oppFmbLost + ts.oppPssInt,
					ts.oppDrives,
				);
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
			} else if (stat === "oppPssTDPct") {
				row[stat] = helpers.percentage(ts.oppPssTD, ts.oppPss);
			} else if (stat === "oppPssIntPct") {
				row[stat] = helpers.percentage(ts.oppPssInt, ts.oppPss);
			} else if (stat === "oppPssYdsPerAtt") {
				row[stat] = ts.oppPssYds / ts.oppPss;
			} else if (stat === "oppPssAdjYdsPerAtt") {
				row[stat] =
					(ts.oppPssYds + 20 * ts.oppPssTD - 45 * ts.oppPssInt) / ts.oppPss;
			} else if (stat === "oppPssYdsPerCmp") {
				row[stat] = ts.oppPssYds / ts.oppPssCmp;
			} else if (stat === "oppPssAdjNetYdsPerAtt") {
				row[stat] =
					(ts.oppPssYds +
						20 * ts.oppPssTD -
						45 * ts.oppPssInt -
						ts.oppPssSkYds) /
					(ts.oppPss + ts.oppPssSk);
			} else if (stat === "oppPssSkPct") {
				row[stat] = helpers.percentage(ts.oppPssSk, ts.oppPssSk + ts.oppPss);
			} else if (stat === "oppPssYdsPerGame") {
				row[stat] = ts.oppPssYds / ts.gp;
			} else if (stat === "oppRusPerGame") {
				row[stat] = ts.oppRus / ts.gp;
			} else if (stat === "oppRusYdsPerGame") {
				row[stat] = ts.oppRusYds / ts.gp;
			} else if (stat === "oppDefTck") {
				row[stat] = ts.oppDefTckSolo + ts.oppDefTckAst;
			} else if (stat === "oppFg") {
				row[stat] =
					ts.oppFg0 + ts.oppFg20 + ts.oppFg30 + ts.oppFg40 + ts.oppFg50;
			} else if (stat === "oppFga") {
				row[stat] =
					ts.oppFga0 + ts.oppFga20 + ts.oppFga30 + ts.oppFga40 + ts.oppFga50;
			} else if (stat === "oppFgPct") {
				row[stat] = helpers.percentage(
					ts.oppFg0 + ts.oppFg20 + ts.oppFg30 + ts.oppFg40 + ts.oppFg50,
					ts.oppFga0 + ts.oppFga20 + ts.oppFga30 + ts.oppFga40 + ts.oppFga50,
				);
			} else if (stat === "oppXpPct") {
				row[stat] = helpers.percentage(ts.oppXp, ts.oppXpa);
			} else if (stat === "oppKickingPts") {
				row[stat] =
					3 * (ts.oppFg0 + ts.oppFg20 + ts.oppFg30 + ts.oppFg40 + ts.oppFg50) +
					ts.oppXp;
			} else if (stat === "oppPntYdsPerAtt") {
				row[stat] = ts.oppPntYds / ts.oppPnt;
			} else if (stat === "oppPrYdsPerAtt") {
				row[stat] = ts.oppPrYds / ts.oppPr;
			} else if (stat === "oppKrYdsPerAtt") {
				row[stat] = ts.oppKrYds / ts.oppKr;
			} else if (stat === "oppAllPurposeYds") {
				row[stat] =
					ts.oppRusYds +
					ts.oppRecYds +
					ts.oppPrYds +
					ts.oppKrYds +
					ts.oppDefIntYds +
					ts.oppDefFmbYds;
			} else if (stat === "oppAllTD") {
				row[stat] =
					ts.oppRusTD +
					ts.oppRecTD +
					ts.oppPrTD +
					ts.oppKrTD +
					ts.oppDefFmbTD +
					ts.oppDefIntTD;
			} else if (stat === "oppQbRat") {
				row[stat] = qbRat({
					pss: ts.oppPss,
					pssCmp: ts.oppPssCmp,
					pssInt: ts.oppPssInt,
					pssYds: ts.oppPssYds,
					pssTD: ts.oppPssTD,
				});
			} else if (stat === "oppCmpPct") {
				row[stat] = helpers.percentage(ts.oppPssCmp, ts.oppPss);
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
