import { bySport, helpers as commonHelpers } from "../../common/index.ts";
import { local } from "./local.ts";

const leagueUrl = (components: (number | string | undefined)[]): string => {
	const lid = local.getState().lid;

	if (typeof lid !== "number") {
		return "/";
	}

	return commonHelpers.leagueUrlBase(lid, components);
};

const plusMinus = (arg: number, d: number): string => {
	if (Number.isNaN(arg)) {
		return "";
	}

	return (arg > 0 ? "+" : "") + arg.toFixed(d);
};

type RoundType =
	| "oneDecimalPlace"
	| "twoDecimalPlaces"
	| "threeDecimalPlaces"
	| "roundWinp"
	| "plusMinus"
	| "plusMinusNoDecimalPlace"
	| "noDecimalPlace"
	| "minutes";

// This only works for stats that are displayed the same in all contexts (per game, totals, individual game - yes, min in BBGM has a special override for individual games) - ideally would have a more comprehensive system. Currently it just assumes things that aren't the same in all contexts are 0 decimal places when totals and 1 otherwise.
const roundOverrides = bySport<Record<string, RoundType>>({
	baseball: {
		gp: "noDecimalPlace",
		gs: "noDecimalPlace",
		min: "oneDecimalPlace",
		yearsWithTeam: "noDecimalPlace",
		pa: "noDecimalPlace",
		ab: "noDecimalPlace",
		r: "noDecimalPlace",
		pts: "noDecimalPlace",
		h: "noDecimalPlace",
		"2b": "noDecimalPlace",
		"3b": "noDecimalPlace",
		hr: "noDecimalPlace",
		rbi: "noDecimalPlace",
		sb: "noDecimalPlace",
		cs: "noDecimalPlace",
		bb: "noDecimalPlace",
		so: "noDecimalPlace",
		ba: "roundWinp",
		obp: "roundWinp",
		slg: "roundWinp",
		ops: "roundWinp",
		tb: "noDecimalPlace",
		gdp: "noDecimalPlace",
		hbp: "noDecimalPlace",
		sh: "noDecimalPlace",
		sf: "noDecimalPlace",
		ibb: "noDecimalPlace",
		w: "noDecimalPlace",
		l: "noDecimalPlace",
		winp: "roundWinp",
		era: "twoDecimalPlaces",
		gpPit: "noDecimalPlace",
		gsPit: "noDecimalPlace",
		gf: "noDecimalPlace",
		cg: "noDecimalPlace",
		sho: "noDecimalPlace",
		sv: "noDecimalPlace",
		bs: "noDecimalPlace",
		hld: "noDecimalPlace",
		ip: "oneDecimalPlace",
		rPit: "noDecimalPlace",
		er: "noDecimalPlace",
		hPit: "noDecimalPlace",
		"2bPit": "noDecimalPlace",
		"3bPit": "noDecimalPlace",
		hrPit: "noDecimalPlace",
		bbPit: "noDecimalPlace",
		soPit: "noDecimalPlace",
		pc: "noDecimalPlace",
		ibbPit: "noDecimalPlace",
		hbpPit: "noDecimalPlace",
		shPit: "noDecimalPlace",
		sfPit: "noDecimalPlace",
		bk: "noDecimalPlace",
		wp: "noDecimalPlace",
		bf: "noDecimalPlace",
		fip: "twoDecimalPlaces",
		whip: "threeDecimalPlaces",
		h9: "oneDecimalPlace",
		hr9: "oneDecimalPlace",
		bb9: "oneDecimalPlace",
		so9: "oneDecimalPlace",
		pc9: "oneDecimalPlace",
		sow: "twoDecimalPlaces",
		rbat: "oneDecimalPlace",
		rbr: "oneDecimalPlace",
		rfldTot: "oneDecimalPlace",
		rpos: "oneDecimalPlace",
		rpit: "oneDecimalPlace",
		raa: "oneDecimalPlace",
		waa: "oneDecimalPlace",
		rrep: "oneDecimalPlace",
		rar: "oneDecimalPlace",
		war: "oneDecimalPlace",
		paMax: "noDecimalPlace",
		abMax: "noDecimalPlace",
		rMax: "noDecimalPlace",
		hMax: "noDecimalPlace",
		"2bMax": "noDecimalPlace",
		"3bMax": "noDecimalPlace",
		hrMax: "noDecimalPlace",
		rbiMax: "noDecimalPlace",
		sbMax: "noDecimalPlace",
		csMax: "noDecimalPlace",
		bbMax: "noDecimalPlace",
		soMax: "noDecimalPlace",
		gdpMax: "noDecimalPlace",
		tbMax: "noDecimalPlace",
		hbpMax: "noDecimalPlace",
		shMax: "noDecimalPlace",
		sfMax: "noDecimalPlace",
		ibbMax: "noDecimalPlace",
		ipMax: "oneDecimalPlace",
		rPitMax: "noDecimalPlace",
		erMax: "noDecimalPlace",
		hPitMax: "noDecimalPlace",
		"2bPitMax": "noDecimalPlace",
		"3bPitMax": "noDecimalPlace",
		hrPitMax: "noDecimalPlace",
		bbPitMax: "noDecimalPlace",
		soPitMax: "noDecimalPlace",
		ibbPitMax: "noDecimalPlace",
		hbpPitMax: "noDecimalPlace",
		shPitMax: "noDecimalPlace",
		sfPitMax: "noDecimalPlace",
		bkMax: "noDecimalPlace",
		wpMax: "noDecimalPlace",
		bfMax: "noDecimalPlace",
		gpF: "noDecimalPlace",
		gsF: "noDecimalPlace",
		cgF: "noDecimalPlace",
		inn: "oneDecimalPlace",
		ch: "noDecimalPlace",
		po: "noDecimalPlace",
		a: "noDecimalPlace",
		e: "noDecimalPlace",
		dp: "noDecimalPlace",
		fldp: "roundWinp",
		rfld: "oneDecimalPlace",
		rf9: "twoDecimalPlaces",
		rfg: "twoDecimalPlaces",
		pb: "noDecimalPlace",
		sbF: "noDecimalPlace",
		csF: "noDecimalPlace",
		csp: "oneDecimalPlace",
		babip: "roundWinp",
		iso: "roundWinp",
	},
	basketball: {
		gp: "noDecimalPlace",
		gs: "noDecimalPlace",
		min: "oneDecimalPlace",
		yearsWithTeam: "noDecimalPlace",
		gmsc: "oneDecimalPlace",
		fgp: "oneDecimalPlace",
		tpp: "oneDecimalPlace",
		"2pp": "oneDecimalPlace",
		efg: "oneDecimalPlace",
		ftp: "oneDecimalPlace",
		ws48: "roundWinp",
		pm: "plusMinus",
		pm100: "plusMinus",
		onOff100: "plusMinus",
		ftpFga: "roundWinp",
		tpar: "roundWinp",
		ftr: "roundWinp",
		bpm: "oneDecimalPlace",
		obpm: "oneDecimalPlace",
		dbpm: "oneDecimalPlace",
		vorp: "oneDecimalPlace",
		per: "oneDecimalPlace",
		ewa: "oneDecimalPlace",
		tsp: "oneDecimalPlace",
		orbp: "oneDecimalPlace",
		drbp: "oneDecimalPlace",
		trbp: "oneDecimalPlace",
		astp: "oneDecimalPlace",
		stlp: "oneDecimalPlace",
		blkp: "oneDecimalPlace",
		tovp: "oneDecimalPlace",
		usgp: "oneDecimalPlace",

		// basketball-reference has these with no decimal place for player stats, but one decimal place for team stats
		ortg: "oneDecimalPlace",
		drtg: "oneDecimalPlace",

		ows: "oneDecimalPlace",
		dws: "oneDecimalPlace",
		ws: "oneDecimalPlace",
		fgpAtRim: "oneDecimalPlace",
		fgpLowPost: "oneDecimalPlace",
		fgpMidRange: "oneDecimalPlace",
		fgMax: "noDecimalPlace",
		fgaMax: "noDecimalPlace",
		tpMax: "noDecimalPlace",
		tpaMax: "noDecimalPlace",
		"2pMax": "noDecimalPlace",
		"2paMax": "noDecimalPlace",
		ftMax: "noDecimalPlace",
		ftaMax: "noDecimalPlace",
		orbMax: "noDecimalPlace",
		drbMax: "noDecimalPlace",
		trbMax: "noDecimalPlace",
		astMax: "noDecimalPlace",
		tovMax: "noDecimalPlace",
		stlMax: "noDecimalPlace",
		blkMax: "noDecimalPlace",
		baMax: "noDecimalPlace",
		pfMax: "noDecimalPlace",
		ptsMax: "noDecimalPlace",
		pmMax: "plusMinusNoDecimalPlace",
		gmscMax: "oneDecimalPlace",
		dd: "noDecimalPlace",
		td: "noDecimalPlace",
		qd: "noDecimalPlace",
		fxf: "noDecimalPlace",
	},
	football: {
		gp: "noDecimalPlace",
		gs: "noDecimalPlace",
		yearsWithTeam: "noDecimalPlace",
		cmpPct: "oneDecimalPlace",
		qbRat: "oneDecimalPlace",
		rusYdsPerAtt: "oneDecimalPlace",
		recYdsPerRec: "oneDecimalPlace",
		fgPct: "oneDecimalPlace",
		xpPct: "oneDecimalPlace",
		pntYdsPerAtt: "oneDecimalPlace",
		krYdsPerAtt: "oneDecimalPlace",
		prYdsPerAtt: "oneDecimalPlace",
		pts: "noDecimalPlace",
		yds: "noDecimalPlace",
		ply: "noDecimalPlace",
		tov: "noDecimalPlace",
		fmbLost: "noDecimalPlace",
		pssCmp: "noDecimalPlace",
		pss: "noDecimalPlace",
		pssYds: "noDecimalPlace",
		pssLng: "noDecimalPlace",
		pssTD: "noDecimalPlace",
		pssInt: "noDecimalPlace",
		pssSk: "noDecimalPlace",
		pssSkYds: "noDecimalPlace",
		rus: "noDecimalPlace",
		rusYds: "noDecimalPlace",
		rusLng: "noDecimalPlace",
		rusTD: "noDecimalPlace",
		rec: "noDecimalPlace",
		recYds: "noDecimalPlace",
		recLng: "noDecimalPlace",
		recTD: "noDecimalPlace",
		pen: "noDecimalPlace",
		penYds: "noDecimalPlace",
		drives: "noDecimalPlace",
		defInt: "noDecimalPlace",
		defIntYds: "noDecimalPlace",
		defIntTD: "noDecimalPlace",
		defIntLng: "noDecimalPlace",
		defPssDef: "noDecimalPlace",
		defFmbFrc: "noDecimalPlace",
		defFmbRec: "noDecimalPlace",
		defFmbYds: "noDecimalPlace",
		defFmbTD: "noDecimalPlace",
		defFmbLng: "noDecimalPlace",
		defSk: "noDecimalPlace",
		defTck: "noDecimalPlace",
		defTckSolo: "noDecimalPlace",
		defTckAst: "noDecimalPlace",
		defTckLoss: "noDecimalPlace",
		defSft: "noDecimalPlace",
		fmb: "noDecimalPlace",
		fg0: "noDecimalPlace",
		fga0: "noDecimalPlace",
		fg20: "noDecimalPlace",
		fga20: "noDecimalPlace",
		fg30: "noDecimalPlace",
		fga30: "noDecimalPlace",
		fg40: "noDecimalPlace",
		fga40: "noDecimalPlace",
		fg50: "noDecimalPlace",
		fga50: "noDecimalPlace",
		fg: "noDecimalPlace",
		fga: "noDecimalPlace",
		fgLng: "noDecimalPlace",
		xp: "noDecimalPlace",
		xpa: "noDecimalPlace",
		kickingPts: "noDecimalPlace",
		tp: "noDecimalPlace",
		tpa: "noDecimalPlace",
		allTD: "noDecimalPlace",
		ko: "noDecimalPlace",
		koYds: "noDecimalPlace",
		koYdsPerAtt: "oneDecimalPlace",
		koTB: "noDecimalPlace",
		koTBPct: "oneDecimalPlace",
		pnt: "noDecimalPlace",
		pntYds: "noDecimalPlace",
		pntLng: "noDecimalPlace",
		pntIn20: "noDecimalPlace",
		pntTB: "noDecimalPlace",
		pntBlk: "noDecimalPlace",
		pr: "noDecimalPlace",
		prYds: "noDecimalPlace",
		prTD: "noDecimalPlace",
		prLng: "noDecimalPlace",
		kr: "noDecimalPlace",
		krYds: "noDecimalPlace",
		krTD: "noDecimalPlace",
		krLng: "noDecimalPlace",
		touches: "noDecimalPlace",
		ydsFromScrimmage: "noDecimalPlace",
		rusRecTD: "noDecimalPlace",
		tgt: "noDecimalPlace",
		allPurposeYds: "noDecimalPlace",
		av: "noDecimalPlace",
		fp: "twoDecimalPlaces",
	},
	hockey: {
		gp: "noDecimalPlace",
		gpGoalie: "noDecimalPlace",
		gpSkater: "noDecimalPlace",
		gs: "noDecimalPlace",
		yearsWithTeam: "noDecimalPlace",
		w: "noDecimalPlace",
		l: "noDecimalPlace",
		t: "noDecimalPlace",
		otl: "noDecimalPlace",
		pm: "plusMinusNoDecimalPlace",
		pim: "noDecimalPlace",
		evG: "noDecimalPlace",
		ppG: "noDecimalPlace",
		shG: "noDecimalPlace",
		gwG: "noDecimalPlace",
		evA: "noDecimalPlace",
		ppA: "noDecimalPlace",
		shA: "noDecimalPlace",
		gwA: "noDecimalPlace",
		s: "noDecimalPlace",
		tsa: "noDecimalPlace",
		fow: "noDecimalPlace",
		fol: "noDecimalPlace",
		foPct: "oneDecimalPlace",
		blk: "noDecimalPlace",
		hit: "noDecimalPlace",
		tk: "noDecimalPlace",
		gv: "noDecimalPlace",
		ga: "noDecimalPlace",
		sv: "noDecimalPlace",
		so: "noDecimalPlace",
		g: "noDecimalPlace",
		a: "noDecimalPlace",
		pts: "noDecimalPlace",
		sPct: "oneDecimalPlace",
		svPct: "roundWinp",
		ppo: "noDecimalPlace",
		ppPct: "oneDecimalPlace",
		sa: "noDecimalPlace",
		gaa: "twoDecimalPlaces",
		ps: "oneDecimalPlace",
		ops: "oneDecimalPlace",
		dps: "oneDecimalPlace",
		gps: "oneDecimalPlace",
		gc: "oneDecimalPlace",
		shft: "noDecimalPlace",
		min: "minutes",
		amin: "minutes",
		ppMin: "minutes",
		shMin: "minutes",
		minMax: "minutes",
		ppMinMax: "minutes",
		shMinMax: "minutes",
		shftMax: "noDecimalPlace",
		pmMax: "plusMinusNoDecimalPlace",
		pimMax: "oneDecimalPlace",
		evGMax: "noDecimalPlace",
		ppGMax: "noDecimalPlace",
		shGMax: "noDecimalPlace",
		evAMax: "noDecimalPlace",
		ppAMax: "noDecimalPlace",
		shAMax: "noDecimalPlace",
		sMax: "noDecimalPlace",
		tsaMax: "noDecimalPlace",
		fowMax: "noDecimalPlace",
		folMax: "noDecimalPlace",
		blkMax: "noDecimalPlace",
		hitMax: "noDecimalPlace",
		tkMax: "noDecimalPlace",
		gvMax: "noDecimalPlace",
		gaMax: "noDecimalPlace",
		svMax: "noDecimalPlace",
		gMax: "noDecimalPlace",
		aMax: "noDecimalPlace",
		ptsMax: "noDecimalPlace",
	},
});

const toLocaleStringWithoutNegativeZero = (
	value: number,
	locales: Intl.LocalesArgument,
	options?: Intl.NumberFormatOptions,
) => {
	const output = value.toLocaleString(locales, options);
	if (output === "-0") {
		return "0";
	}
	return output;
};

const formatNumber = (value: number, type: RoundType): string => {
	if (type === "oneDecimalPlace") {
		if (value === 100) {
			return "100";
		}

		return toLocaleStringWithoutNegativeZero(value, "en-US", {
			maximumFractionDigits: 1,
			minimumFractionDigits: 1,
		});
	} else if (type === "twoDecimalPlaces") {
		return toLocaleStringWithoutNegativeZero(value, "en-US", {
			maximumFractionDigits: 2,
			minimumFractionDigits: 2,
		});
	} else if (type === "threeDecimalPlaces") {
		return toLocaleStringWithoutNegativeZero(value, "en-US", {
			maximumFractionDigits: 3,
			minimumFractionDigits: 3,
		});
	} else if (type === "roundWinp") {
		return commonHelpers.roundWinp(value);
	} else if (type === "plusMinus") {
		return plusMinus(value, 1);
	} else if (type === "plusMinusNoDecimalPlace") {
		return plusMinus(value, 0);
	} else if (type === "noDecimalPlace") {
		return toLocaleStringWithoutNegativeZero(value, "en-US", {
			maximumFractionDigits: 0,
		});
	} else if (type === "minutes") {
		if (value > 100) {
			return toLocaleStringWithoutNegativeZero(value, "en-US", {
				maximumFractionDigits: 0,
			});
		}

		if (value === 0) {
			return "--:--";
		}

		const remainder = value % 1;
		let seconds = Math.round(remainder * 60);
		let minutes = Math.floor(value);
		while (seconds >= 60) {
			minutes += 1;
			seconds -= 60;
		}
		return `${minutes}:${seconds >= 10 ? seconds : `0${seconds}`}`;
	} else {
		throw new Error("Should never happen");
	}
};

const roundStat = (
	value: number | string,
	stat: string,
	totals: boolean = false,
): string => {
	try {
		if (typeof value === "string") {
			return value;
		}

		// Number of decimals for many stats
		const decimalPlaces = totals ? 0 : 1;

		if (Number.isNaN(value)) {
			value = 0;
		}

		if (value === Infinity) {
			return "inf";
		}
		if (value === -Infinity) {
			return "-inf";
		}

		let type = roundOverrides[stat];
		if (!type && stat.startsWith("opp")) {
			const withoutOpp = stat.replace("opp", "");
			const statWithoutOpp = `${withoutOpp.charAt(0).toLowerCase()}${withoutOpp.slice(1)}`;
			type = roundOverrides[statWithoutOpp];
		}

		if (type) {
			if (type === "plusMinus" && totals) {
				return formatNumber(value, "plusMinusNoDecimalPlace");
			}
			return formatNumber(value, type);
		}

		return toLocaleStringWithoutNegativeZero(value, "en-US", {
			maximumFractionDigits: decimalPlaces,
			minimumFractionDigits: decimalPlaces,
		});
	} catch {
		return "";
	}
};

const yearRanges = (arrInput: number[]): string[] => {
	if (arrInput.length <= 1) {
		return arrInput.map(String);
	}

	const arr = [...arrInput];
	arr.sort((a, b) => a - b);

	const runArr: string[] = [];
	const tempArr = [[arr[0]!]];

	for (let i = 1; i < arr.length; i++) {
		// @ts-expect-error
		if (arr[i] - arr[i - 1] > 1) {
			tempArr.push([]);
		}

		tempArr.at(-1)!.push(arr[i]!);
	}

	for (const row of tempArr) {
		// runs of up to 2 consecutive years are displayed individually
		if (row.length <= 2) {
			runArr.push(String(row[0]));

			if (row.length === 2) {
				runArr.push(String(row[1]));
			}
		} else {
			// runs of 3 or more are displayed as a range
			runArr.push(`${row[0]}-${row.at(-1)}`);
		}
	}

	return runArr;
};

const formatCurrency = (
	amount: number,
	initialUnits?: "M" | "",
	precision?: number,
): string => {
	const currencyFormat = local.getState().currencyFormat;
	return commonHelpers.formatCurrencyBase(
		currencyFormat,
		amount,
		initialUnits,
		precision,
	);
};

const helpers = {
	...commonHelpers,
	formatCurrency,
	formatNumber,
	leagueUrl,
	plusMinus,
	roundStat,
	yearRanges,
};

export default helpers;
