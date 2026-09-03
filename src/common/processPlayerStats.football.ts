import { helpers } from "./helpers.ts";
import type { GameAttributesLeague, PlayerStats } from "./types.ts";

export const qbRat = (ps: {
	pss: number;
	pssCmp: number;
	pssInt: number;
	pssYds: number;
	pssTD: number;
}) => {
	const a = helpers.bound((ps.pssCmp / ps.pss - 0.3) * 5, 0, 2.375);
	const b = helpers.bound((ps.pssYds / ps.pss - 3) * 0.25, 0, 2.375);
	const c = helpers.bound((ps.pssTD / ps.pss) * 20, 0, 2.375);
	const d = helpers.bound(2.375 - (ps.pssInt / ps.pss) * 25, 0, 2.375);
	return ((a + b + c + d) / 6) * 100;
};

type StatFunction = (
	ps: PlayerStats,
	extra: {
		bornYear: number | undefined;
		getFantasyPoints: () => GameAttributesLeague["fantasyPoints"];
	},
) => number | string | undefined;

export const statFunctions = {
	cmpPct: (ps) => helpers.percentage(ps.pssCmp, ps.pss),
	qbRat: (ps) => qbRat(ps),
	rusYdsPerAtt: (ps) => ps.rusYds / ps.rus,
	fg: (ps) => ps.fg0 + ps.fg20 + ps.fg30 + ps.fg40 + ps.fg50,
	fga: (ps) => ps.fga0 + ps.fga20 + ps.fga30 + ps.fga40 + ps.fga50,
	fgPct: (ps) =>
		helpers.percentage(
			ps.fg0 + ps.fg20 + ps.fg30 + ps.fg40 + ps.fg50,
			ps.fga0 + ps.fga20 + ps.fga30 + ps.fga40 + ps.fga50,
		),
	xpPct: (ps) => helpers.percentage(ps.xp, ps.xpa),
	kickingPts: (ps) =>
		3 * (ps.fg0 + ps.fg20 + ps.fg30 + ps.fg40 + ps.fg50) + ps.xp,
	pntYdsPerAtt: (ps) => ps.pntYds / ps.pnt,
	defTck: (ps) => ps.defTckSolo + ps.defTckAst,
	qbRec: (ps) => {
		if (ps.qbW !== undefined && ps.qbL !== undefined) {
			return helpers.formatRecord({
				won: ps.qbW,
				lost: ps.qbL,
				tied: ps.qbT,
				otl: ps.qbOTL,
			});
		}
		return "0-0";
	},
	pssTDPct: (ps) => helpers.percentage(ps.pssTD, ps.pss),
	pssIntPct: (ps) => helpers.percentage(ps.pssInt, ps.pss),
	pssYdsPerAtt: (ps) => ps.pssYds / ps.pss,
	pssAdjYdsPerAtt: (ps) =>
		(ps.pssYds + 20 * ps.pssTD - 45 * ps.pssInt) / ps.pss,
	pssYdsPerCmp: (ps) => ps.pssYds / ps.pssCmp,
	pssYdsPerGame: (ps) => ps.pssYds / ps.gp,
	pssNetYdsPerAtt: (ps) => (ps.pssYds - ps.pssSkYds) / (ps.pss + ps.pssSk),
	pssAdjNetYdsPerAtt: (ps) =>
		(ps.pssYds + 20 * ps.pssTD - 45 * ps.pssInt - ps.pssSkYds) /
		(ps.pss + ps.pssSk),
	pssSkPct: (ps) => helpers.percentage(ps.pssSk, ps.pssSk + ps.pss),
	rusYdsPerGame: (ps) => ps.rusYds / ps.gp,
	rusPerGame: (ps) => ps.rus / ps.gp,
	recYdsPerRec: (ps) => ps.recYds / ps.rec,
	recPerGame: (ps) => ps.rec / ps.gp,
	recYdsPerGame: (ps) => ps.recYds / ps.gp,
	recCatchPct: (ps) => helpers.percentage(ps.rec, ps.tgt),
	touches: (ps) => ps.rus + ps.rec,
	ydsPerTouch: (ps) => (ps.rusYds + ps.recYds) / (ps.rus + ps.rec),
	ydsFromScrimmage: (ps) => ps.rusYds + ps.recYds,
	rusRecTD: (ps) => ps.rusTD + ps.recTD,
	prYdsPerAtt: (ps) => ps.prYds / ps.pr,
	krYdsPerAtt: (ps) => ps.krYds / ps.kr,
	allPurposeYds: (ps) =>
		ps.rusYds + ps.recYds + ps.prYds + ps.krYds + ps.defIntYds + ps.defFmbYds,
	koTBPct: (ps) => helpers.percentage(ps.koTB, ps.ko),
	koYdsPerAtt: (ps) => helpers.ratio(ps.koYds, ps.ko),
	okRecPct: (ps) => helpers.percentage(ps.okRec, ps.ok),
	totTD: (ps) =>
		ps.rusTD + ps.recTD + ps.prTD + ps.krTD + ps.defIntTD + ps.defFmbTD,
	fp: (ps, { getFantasyPoints }) => {
		let value =
			ps.pssYds / 25 +
			4 * ps.pssTD +
			(ps.rusYds + ps.recYds) / 10 +
			6 * (ps.rusTD + ps.recTD + ps.prTD + ps.krTD) -
			2 * (ps.pssInt + ps.fmbLost) +
			ps.xp +
			3 * ps.fg0 +
			3 * ps.fg20 +
			3 * ps.fg30 +
			4 * ps.fg40 +
			5 * ps.fg50;

		const fantasyPoints = getFantasyPoints();
		if (fantasyPoints === "ppr") {
			value += ps.rec;
		} else if (fantasyPoints === "halfPpr") {
			value += 0.5 * ps.rec;
		}

		return value;
	},
	pbwr: (ps) => helpers.percentage(ps.pbw, ps.pba),
	rbwr: (ps) => helpers.percentage(ps.rbw, ps.rba),
	skAlwPct: (ps) => helpers.percentage(ps.skAlw, ps.pba),
	pntTBPct: (ps) => helpers.percentage(ps.pntTB, ps.pnt),
	pntIn20Pct: (ps) => helpers.percentage(ps.pntIn20, ps.pnt),
	keyStats: (ps) => {
		const defTck = ps.defTckSolo + ps.defTckAst;
		const fga = ps.fga0 + ps.fga20 + ps.fga30 + ps.fga40 + ps.fga50;
		const counts = {
			passer: ps.pss,
			rusher: ps.rus,
			receiver: ps.rec,
			defender: defTck,
			kicker: fga + ps.xpa,
			punter: ps.pnt,
			ol: ((ps.pba ?? 0) + (ps.pra ?? 0)) / 10,
		};
		let role;
		let max = 0;

		for (const [key, value] of Object.entries(counts)) {
			if (value > max) {
				role = key;
				max = value;
			}
		}
		if (
			(role === "rusher" && ps.recYds > 0.5 * ps.rusYds) ||
			(role === "receiver" && ps.rusYds > 0.5 * ps.recYds)
		) {
			role = "rusRec";
		}

		if (role === "passer") {
			return `${helpers
				.percentage(ps.pssCmp, ps.pss)
				?.toFixed(1)}%, ${helpers.numberWithCommas(ps.pssYds)} yards, ${
				ps.pssTD
			} TD, ${ps.pssInt} int, ${qbRat(ps).toFixed(1)} QBRat`;
		} else if (role === "rusher") {
			return `${helpers.numberWithCommas(
				ps.rus,
			)} rushes, ${helpers.numberWithCommas(ps.rusYds)} yards, ${(
				ps.rusYds / ps.rus
			).toFixed(1)} avg, ${ps.rusTD} TD`;
		} else if (role === "receiver") {
			return `${helpers.numberWithCommas(
				ps.rec,
			)} catches, ${helpers.numberWithCommas(ps.recYds)} yards, ${(
				ps.recYds / ps.rec
			).toFixed(1)} avg, ${ps.recTD} TD`;
		} else if (role === "rusRec") {
			return `${helpers.numberWithCommas(
				ps.rec + ps.rus,
			)} touches, ${helpers.numberWithCommas(ps.recYds + ps.rusYds)} total yards, ${ps.recTD + ps.rusTD} TD`;
		} else if (role === "defender") {
			return `${helpers.numberWithCommas(defTck)} tackles, ${
				ps.defSk
			} sacks, ${ps.defPssDef} PD, ${ps.defInt} int`;
		} else if (role === "kicker") {
			const fgm = ps.fg0 + ps.fg20 + ps.fg30 + ps.fg40 + ps.fg50;
			return `${fgm} FGs, ${helpers.percentage(fgm, fga)?.toFixed(1)}%`;
		} else if (role === "punter") {
			return `${ps.pnt} punts, ${(ps.pntYds / ps.pnt).toFixed(1)} yards avg`;
		} else if (role === "ol") {
			return `${ps.pbw} PBW${ps.pba > 0 ? ` (${helpers.percentage(ps.pbw, ps.pba)?.toFixed(1)}%)` : ""}, ${ps.rbw} RBW${ps.rba > 0 ? ` (${helpers.percentage(ps.rbw, ps.rba)?.toFixed(1)}%)` : ""}`;
		} else {
			return "";
		}
	},
	age: (ps, { bornYear }) => {
		if (bornYear === undefined) {
			throw new Error(
				"You must supply bornYear to processStats if you want age",
			);
		}

		return ps.season - bornYear;
	},
} satisfies Record<string, StatFunction>;

export const processStats = (
	ps: PlayerStats,
	stats: Iterable<string>,
	bornYear: number | undefined,
	getFantasyPoints: () => GameAttributesLeague["fantasyPoints"],
) => {
	const row: any = {};

	const statFunctions2 = statFunctions as Record<string, StatFunction>;
	const extra = {
		bornYear,
		getFantasyPoints,
	};

	for (const stat of stats) {
		if (statFunctions2[stat]) {
			row[stat] = statFunctions2[stat](ps, extra);
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
