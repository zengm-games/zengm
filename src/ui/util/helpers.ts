import { bySport, helpers as commonHelpers } from "../../common";
import { local } from "./local";

const leagueUrl = (components: (number | string | undefined)[]): string => {
	const lid = local.getState().lid;

	if (typeof lid !== "number") {
		return "/";
	}

	return commonHelpers.leagueUrlFactory(lid, components);
};

const plusMinus = (arg: number, d: number): string => {
	if (Number.isNaN(arg)) {
		return "";
	}

	return (arg > 0 ? "+" : "") + arg.toFixed(d);
};

const roundOverrides: Record<
	string,
	| "none"
	| "oneDecimalPlace"
	| "twoDecimalPlaces"
	| "roundWinp"
	| "plusMinus"
	| "plusMinusNoDecimalPlace"
	| "noDecimalPlace"
	| "minutes"
	| undefined
> = bySport({
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
		ftpFga: "roundWinp",
		tpar: "roundWinp",
		ftr: "roundWinp",
		bpm: "oneDecimalPlace",
		obpm: "oneDecimalPlace",
		dbpm: "oneDecimalPlace",
		vorp: "oneDecimalPlace",
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
		dd: "noDecimalPlace",
		td: "noDecimalPlace",
		qd: "noDecimalPlace",
		fxf: "noDecimalPlace",
		oppDd: "noDecimalPlace",
		oppTd: "noDecimalPlace",
		oppQd: "noDecimalPlace",
		oppFxf: "noDecimalPlace",
	},
	football: {
		gp: "noDecimalPlace",
		gs: "noDecimalPlace",
		yearsWithTeam: "noDecimalPlace",
		cmpPct: "oneDecimalPlace",
		qbRat: "oneDecimalPlace",
		rusYdsPerAtt: "oneDecimalPlace",
		recYdsPerAtt: "oneDecimalPlace",
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
		pnt: "noDecimalPlace",
		pntYds: "noDecimalPlace",
		pntLng: "noDecimalPlace",
		pntBlk: "noDecimalPlace",
		pr: "noDecimalPlace",
		prYds: "noDecimalPlace",
		prTD: "noDecimalPlace",
		prLng: "noDecimalPlace",
		kr: "noDecimalPlace",
		krYds: "noDecimalPlace",
		krTD: "noDecimalPlace",
		krLng: "noDecimalPlace",
		oppPts: "noDecimalPlace",
		oppYds: "noDecimalPlace",
		oppPly: "noDecimalPlace",
		oppTov: "noDecimalPlace",
		oppFmbLost: "noDecimalPlace",
		oppPssCmp: "noDecimalPlace",
		oppPss: "noDecimalPlace",
		oppPssYds: "noDecimalPlace",
		oppPssTD: "noDecimalPlace",
		oppPssInt: "noDecimalPlace",
		oppRus: "noDecimalPlace",
		oppRusYds: "noDecimalPlace",
		oppRusTD: "noDecimalPlace",
		oppPen: "noDecimalPlace",
		oppPenYds: "noDecimalPlace",
		oppDrives: "noDecimalPlace",
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
		oppPts: "noDecimalPlace",
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
		min: "minutes",
		amin: "minutes",
		ppMin: "minutes",
		shMin: "minutes",
		minMax: "minutes",
		ppMinMax: "minutes",
		shMinMax: "minutes",
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
		oppG: "noDecimalPlace",
		oppA: "noDecimalPlace",
		oppPim: "noDecimalPlace",
		oppEvG: "noDecimalPlace",
		oppPpG: "noDecimalPlace",
		oppShG: "noDecimalPlace",
		oppEvA: "noDecimalPlace",
		oppPpA: "noDecimalPlace",
		oppShA: "noDecimalPlace",
		oppS: "noDecimalPlace",
		oppSPct: "oneDecimalPlace",
		oppTsa: "noDecimalPlace",
		oppPpo: "noDecimalPlace",
		oppPpPct: "oneDecimalPlace",
		oppFow: "noDecimalPlace",
		oppFol: "noDecimalPlace",
		oppFoPct: "oneDecimalPlace",
		oppBlk: "noDecimalPlace",
		oppHit: "noDecimalPlace",
		oppTk: "noDecimalPlace",
		oppGv: "noDecimalPlace",
		oppSv: "noDecimalPlace",
		oppSvPct: "roundWinp",
		oppGaa: "twoDecimalPlaces",
		oppSo: "noDecimalPlace",
	},
});

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
		const d = totals ? 0 : 1;

		if (Number.isNaN(value)) {
			value = 0;
		}

		if (roundOverrides[stat] === "minutes") {
			if (value > 100) {
				return value.toLocaleString("en-US", { maximumFractionDigits: 0 });
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
		}

		if (roundOverrides[stat] === "oneDecimalPlace") {
			if (value === 100) {
				return "100";
			}

			return value.toLocaleString("en-US", {
				maximumFractionDigits: 1,
				minimumFractionDigits: 1,
			});
		}

		if (roundOverrides[stat] === "twoDecimalPlaces") {
			return value.toLocaleString("en-US", {
				maximumFractionDigits: 2,
				minimumFractionDigits: 2,
			});
		}

		if (roundOverrides[stat] === "roundWinp") {
			return commonHelpers.roundWinp(value);
		}

		if (roundOverrides[stat] === "plusMinus") {
			return plusMinus(value, d);
		}

		if (roundOverrides[stat] === "plusMinusNoDecimalPlace") {
			return plusMinus(value, 0);
		}

		if (roundOverrides[stat] === "noDecimalPlace") {
			return value.toLocaleString("en-US", { maximumFractionDigits: 0 });
		}

		return value.toLocaleString("en-US", {
			maximumFractionDigits: d,
			minimumFractionDigits: d,
		});
	} catch (err) {
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
	const tempArr = [[arr[0]]];

	for (let i = 1; i < arr.length; i++) {
		if (arr[i] - arr[i - 1] > 1) {
			tempArr.push([]);
		}

		tempArr.at(-1).push(arr[i]);
	}

	for (let i = 0; i < tempArr.length; i++) {
		// runs of up to 2 consecutive years are displayed individually
		if (tempArr[i].length <= 2) {
			runArr.push(String(tempArr[i][0]));

			if (tempArr[i].length === 2) {
				runArr.push(String(tempArr[i][1]));
			}
		} else {
			// runs of 3 or more are displayed as a range
			runArr.push(`${tempArr[i][0]}-${tempArr[i].at(-1)}`);
		}
	}

	return runArr;
};

const helpers = {
	...commonHelpers,
	leagueUrl,
	plusMinus,
	roundStat,
	yearRanges,
};

export default helpers;
