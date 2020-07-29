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
		if (stat === "cmpPct") {
			row[stat] = percentage(ps.pssCmp, ps.pss);
		} else if (stat === "qbRat") {
			row[stat] = qbRat(ps);
		} else if (stat === "rusYdsPerAtt") {
			row[stat] = ps.rusYds / ps.rus;
		} else if (stat === "recYdsPerAtt") {
			row[stat] = ps.recYds / ps.rec;
		} else if (stat === "fg") {
			row[stat] = ps.fg0 + ps.fg20 + ps.fg30 + ps.fg40 + ps.fg50;
		} else if (stat === "fga") {
			row[stat] = ps.fga0 + ps.fga20 + ps.fga30 + ps.fga40 + ps.fga50;
		} else if (stat === "fgPct") {
			row[stat] = percentage(
				ps.fg0 + ps.fg20 + ps.fg30 + ps.fg40 + ps.fg50,
				ps.fga0 + ps.fga20 + ps.fga30 + ps.fga40 + ps.fga50,
			);
		} else if (stat === "xpPct") {
			row[stat] = percentage(ps.xp, ps.xpa);
		} else if (stat === "kickingPts") {
			row[stat] = 3 * (ps.fg0 + ps.fg20 + ps.fg30 + ps.fg40 + ps.fg50) + ps.xp;
		} else if (stat === "pntYdsPerAtt") {
			row[stat] = ps.pntYds / ps.pnt;
		} else if (stat === "defTck") {
			row[stat] = ps.defTckSolo + ps.defTckAst;
		} else if (stat === "qbRec") {
			if (
				ps.qbW !== undefined &&
				ps.qbL !== undefined &&
				ps.qbT !== undefined
			) {
				row[stat] = `${ps.qbW}-${ps.qbL}-${ps.qbT}`;
			} else {
				row[stat] = "0-0-0";
			}
		} else if (stat === "pssTDPct") {
			row[stat] = percentage(ps.pssTD, ps.pss);
		} else if (stat === "pssIntPct") {
			row[stat] = percentage(ps.pssInt, ps.pss);
		} else if (stat === "pssYdsPerAtt") {
			row[stat] = ps.pssYds / ps.pss;
		} else if (stat === "pssAdjYdsPerAtt") {
			row[stat] = (ps.pssYds + 20 * ps.pssTD - 45 * ps.pssInt) / ps.pss;
		} else if (stat === "pssYdsPerCmp") {
			row[stat] = ps.pssYds / ps.pssCmp;
		} else if (stat === "pssYdsPerGame") {
			row[stat] = ps.pssYds / ps.gp;
		} else if (stat === "pssNetYdsPerAtt") {
			row[stat] = (ps.pssYds - ps.pssSkYds) / (ps.pss + ps.pssSk);
		} else if (stat === "pssAdjNetYdsPerAtt") {
			row[stat] =
				(ps.pssYds + 20 * ps.pssTD - 45 * ps.pssInt - ps.pssSkYds) /
				(ps.pss + ps.pssSk);
		} else if (stat === "pssSkPct") {
			row[stat] = percentage(ps.pssSk, ps.pssSk + ps.pss);
		} else if (stat === "rusYdsPerGame") {
			row[stat] = ps.rusYds / ps.gp;
		} else if (stat === "rusPerGame") {
			row[stat] = ps.rus / ps.gp;
		} else if (stat === "recYdsPerRec") {
			row[stat] = ps.recYds / ps.rec;
		} else if (stat === "recPerGame") {
			row[stat] = ps.rec / ps.gp;
		} else if (stat === "recYdsPerGame") {
			row[stat] = ps.recYds / ps.gp;
		} else if (stat === "recCatchPct") {
			row[stat] = percentage(ps.rec, ps.tgt);
		} else if (stat === "touches") {
			row[stat] = ps.rus + ps.rec;
		} else if (stat === "ydsPerTouch") {
			row[stat] = (ps.rusYds + ps.recYds) / (ps.rus + ps.rec);
		} else if (stat === "ydsFromScrimmage") {
			row[stat] = ps.rusYds + ps.recYds;
		} else if (stat === "rusRecTD") {
			row[stat] = ps.rusTD + ps.recTD;
		} else if (stat === "prYdsPerAtt") {
			row[stat] = ps.prYds / ps.pr;
		} else if (stat === "krYdsPerAtt") {
			row[stat] = ps.krYds / ps.kr;
		} else if (stat === "allPurposeYds") {
			row[stat] =
				ps.rusYds +
				ps.recYds +
				ps.prYds +
				ps.krYds +
				ps.defIntYds +
				ps.defFmbYds;
		} else if (stat === "keyStats") {
			const defTck = ps.defTckSolo + ps.defTckAst;
			const fga = ps.fga0 + ps.fga20 + ps.fga30 + ps.fga40 + ps.fga50;
			const counts = {
				passer: ps.pss,
				rusher: ps.rus,
				receiver: ps.rec,
				defender: defTck,
				kicker: fga + ps.xpa,
				punter: ps.pnt,
			};
			let role;
			let max = 0;

			for (const [key, value] of Object.entries(counts)) {
				if (value > max) {
					role = key;
					max = value;
				}
			}

			if (role === "passer") {
				row[stat] = `${percentage(ps.pssCmp, ps.pss).toFixed(
					1,
				)}%, ${helpers.numberWithCommas(ps.pssYds)} yards, ${ps.pssTD} TD, ${
					ps.pssInt
				} int, ${qbRat(ps).toFixed(1)} QBRat`;
			} else if (role === "rusher") {
				row[stat] = `${helpers.numberWithCommas(
					ps.rus,
				)} rushes, ${helpers.numberWithCommas(ps.rusYds)} yards, ${(
					ps.rusYds / ps.rus
				).toFixed(1)} avg, ${ps.rusTD} TD`;
			} else if (role === "receiver") {
				row[stat] = `${helpers.numberWithCommas(
					ps.rec,
				)} catches, ${helpers.numberWithCommas(ps.recYds)} yards, ${(
					ps.recYds / ps.rec
				).toFixed(1)} avg, ${ps.recTD} TD`;
			} else if (role === "defender") {
				row[stat] = `${helpers.numberWithCommas(defTck)} tackles, ${
					ps.defSk
				} sacks, ${ps.defPssDef} PD, ${ps.defInt} int`;
			} else if (role === "kicker") {
				const fgm = ps.fg0 + ps.fg20 + ps.fg30 + ps.fg40 + ps.fg50;
				row[stat] = `${fgm} FGs, ${percentage(fgm, fga).toFixed(1)}%`;
			} else if (role === "punter") {
				row[stat] = `${ps.pnt} punts, ${(ps.pntYds / ps.pnt).toFixed(
					1,
				)} yards avg`;
			} else {
				row[stat] = "";
			}
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
