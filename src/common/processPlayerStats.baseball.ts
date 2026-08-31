import { helpers } from "./helpers.ts";
import type { PlayerStats, PlayerStatType } from "./types.ts";

export const NUM_OUTS_PER_GAME = 27;

export const sumByPos = (array: (number | undefined)[] | undefined) => {
	if (!array) {
		return 0;
	}

	let sum = 0;
	for (const value of array) {
		if (value !== undefined) {
			sum += value;
		}
	}

	return sum;
};

export const outsToInnings = (outs: number) => {
	// Not sure why this is needed, but it happens sometimes
	if (outs === undefined) {
		return 0;
	}

	const completeInnings = Math.floor(outs / 3);
	const fractionalInnings = outs % 3;
	return completeInnings + fractionalInnings / 10;
};

type StatFunction = (
	ps: PlayerStats,
	extra: {
		ab: number;
		ba: number;
		bornYear: number | undefined;
		derivedByPosStat: (cb: (i: number) => number) => number[];
		era: number;
		ip: number;
		obp: number;
		slg: number;
		tb: number;
	},
) => number | string | number[] | undefined;

const getKeyStatsFactory =
	(stat: "keyStats" | "keyStatsShort"): StatFunction =>
	(ps, { ab, ba, era, ip, obp, slg }) => {
		let role: string | undefined;
		if (ps.pa > 0 && ps.pa >= ps.pc) {
			role = "batter";
		} else if (ps.pc > 0) {
			role = "pitcher";
		}

		if (role === "batter") {
			let value;
			if (stat === "keyStatsShort") {
				value = `${helpers.roundWinp(ba)} BA, `;
			} else {
				value = "";
			}
			value += `${ps.hr} HR`;
			if (stat === "keyStats") {
				value += `, ${ab} AB, ${helpers.roundWinp(
					ba,
				)} / ${helpers.roundWinp(obp)} / ${helpers.roundWinp(slg)}`;
			}

			return value;
		}

		if (role === "pitcher") {
			const recordOrSaves =
				ps.w >= ps.sv
					? helpers.formatRecord({
							won: ps.w,
							lost: ps.l,
						})
					: `${ps.sv} SV`;
			let value = `${recordOrSaves}, ${era.toFixed(2)} ERA`;
			if (stat === "keyStats") {
				value += `, ${ip.toFixed(1)} IP`;
			}

			return value;
		}

		return "";
	};

export const statFunctions = {
	age: (ps, { bornYear }) => {
		if (bornYear === undefined) {
			throw new Error(
				"You must supply bornYear to processStats if you want age",
			);
		}

		return ps.season - bornYear;
	},
	keyStats: getKeyStatsFactory("keyStats"),
	keyStatsShort: getKeyStatsFactory("keyStatsShort"),
	ab: (ps, { ab }) => ab,
	ba: (ps, { ba }) => ba,
	obp: (ps, { obp }) => obp,
	slg: (ps, { slg }) => slg,
	ops: (ps, { obp, slg }) => obp + slg,
	tb: (ps, { tb }) => tb,
	ip: (ps, { ip }) => ip,
	winp: (ps) => helpers.ratio(ps.w, ps.w + ps.l),
	era: (ps, { era }) => era,
	fip: (ps) =>
		helpers.ratio(
			13 * ps.hrPit + 3 * (ps.hbpPit + ps.bbPit) - 2 * ps.soPit,
			ps.outs / 3,
			true,
		) + 3.2,
	whip: (ps) => helpers.ratio(ps.bbPit + ps.hPit, ps.outs / 3, true),
	h9: (ps) => helpers.ratio(ps.hPit, ps.outs / NUM_OUTS_PER_GAME, true),
	hr9: (ps) => helpers.ratio(ps.hrPit, ps.outs / NUM_OUTS_PER_GAME, true),
	bb9: (ps) => helpers.ratio(ps.bbPit, ps.outs / NUM_OUTS_PER_GAME, true),
	so9: (ps) => helpers.ratio(ps.soPit, ps.outs / NUM_OUTS_PER_GAME, true),
	pc9: (ps) => helpers.ratio(ps.pc, ps.outs / NUM_OUTS_PER_GAME, true),
	sow: (ps) => helpers.ratio(ps.soPit, ps.bbPit, true),
	rfldTot: (ps) => sumByPos(ps.rfld),
	ch: (ps, { derivedByPosStat }) => {
		return derivedByPosStat(
			(i) => (ps.po[i] ?? 0) + (ps.a[i] ?? 0) + (ps.e[i] ?? 0),
		);
	},
	fldp: (ps, { derivedByPosStat }) => {
		return derivedByPosStat((i) =>
			helpers.ratio(
				(ps.po[i] ?? 0) + (ps.a[i] ?? 0),
				(ps.po[i] ?? 0) + (ps.a[i] ?? 0) + (ps.e[i] ?? 0),
			),
		);
	},
	rf9: (ps, { derivedByPosStat }) => {
		return derivedByPosStat((i) =>
			helpers.ratio(
				(ps.po[i] ?? 0) + (ps.a[i] ?? 0),
				(ps.outsF[i] ?? 0) / NUM_OUTS_PER_GAME,
				true,
			),
		);
	},
	rfg: (ps, { derivedByPosStat }) => {
		return derivedByPosStat((i) =>
			helpers.ratio((ps.po[i] ?? 0) + (ps.a[i] ?? 0), ps.gpF[i]),
		);
	},
	csp: (ps) => helpers.percentage(ps.csF, ps.csF + ps.sbF),
	inn: (ps, { derivedByPosStat }) =>
		derivedByPosStat((i) => outsToInnings(ps.outsF[i])),
	babip: (ps, { ab }) =>
		helpers.ratio(ps.h - ps.hr, ab - ps.so - ps.hr + ps.sf),
	iso: (ps, { ab, tb }) => helpers.ratio(tb - ps.h, ab),
	gmsc: (ps) => helpers.gameScoreBaseball(ps),
} satisfies Record<string, StatFunction>;

export const processStats = (
	ps: PlayerStats,
	stats: Iterable<string>,
	statType?: PlayerStatType,
	bornYear?: number,
) => {
	const row: any = {};

	const ab = ps.pa - ps.bb - ps.hbp - ps.sf;
	const tb = ps.h + ps["2b"] + 2 * ps["3b"] + 3 * ps.hr;
	const ba = helpers.ratio(ps.h, ab);
	const obp = helpers.ratio(ps.h + ps.bb + ps.hbp, ab + ps.bb + ps.hbp + ps.sf);
	const slg = helpers.ratio(tb, ab);

	const ip = outsToInnings(ps.outs);
	const era = helpers.ratio(ps.er, ps.outs / NUM_OUTS_PER_GAME, true);

	let posIndexesChecked = false;
	const posIndexes: number[] = [];
	const initPosIndexes = () => {
		if (!posIndexesChecked && row.gpF !== undefined) {
			for (let i = 0; i < row.gpF.length; i++) {
				if (row.gpF[i] !== undefined) {
					posIndexes.push(i);
				}
			}
			posIndexesChecked = true;
		}
	};

	const derivedByPosStat = (cb: (i: number) => number) => {
		const output = [];
		initPosIndexes();
		if (posIndexes.length > 0) {
			for (const i of posIndexes) {
				output[i] = cb(i);
			}
		}
		return output;
	};

	const statFunctions2 = statFunctions as Record<string, StatFunction>;
	const extra = { ab, ba, bornYear, derivedByPosStat, era, ip, obp, slg, tb };

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
