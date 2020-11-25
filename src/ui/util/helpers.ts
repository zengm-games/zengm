import { helpers as commonHelpers } from "../../common";
import { local } from "./local";

const colorRating = (rating: number) => {
	const classes = ["table-danger", "table-warning", undefined, "table-success"];
	const cutoffs = [30, 45, 60, Infinity];
	const ind = cutoffs.findIndex(cutoff => rating < cutoff);
	return classes[ind];
};

const leagueUrl = (components: (number | string)[]): string => {
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
	| "roundWinp"
	| "plusMinus"
	| "plusMinusNoDecimalPlace"
	| "noDecimalPlace"
	| undefined
> =
	process.env.SPORT === "basketball"
		? {
				gp: "noDecimalPlace",
				gs: "noDecimalPlace",
				yearsWithTeam: "noDecimalPlace",
				gmsc: "oneDecimalPlace",
				fgp: "oneDecimalPlace",
				tpp: "oneDecimalPlace",
				"2pp": "oneDecimalPlace",
				efg: "oneDecimalPlace",
				ftp: "oneDecimalPlace",
				ws48: "roundWinp",
				pm: "plusMinus",
				ftpfga: "roundWinp",
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
		  }
		: {
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
		const d = totals ? 0 : 1;

		if (Number.isNaN(value)) {
			value = 0;
		}

		if (roundOverrides[stat] === "oneDecimalPlace") {
			return value.toLocaleString("en-US", {
				maximumFractionDigits: 1,
				minimumFractionDigits: 1,
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

const yearRanges = (arr: number[]): string[] => {
	if (arr.length <= 1) {
		return arr.map(String);
	}

	const runArr: string[] = [];
	const tempArr = [[arr[0]]];

	for (let i = 1; i < arr.length; i++) {
		if (arr[i] - arr[i - 1] > 1) {
			tempArr.push([]);
		}

		tempArr[tempArr.length - 1].push(arr[i]);
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
			runArr.push(`${tempArr[i][0]}-${tempArr[i][tempArr[i].length - 1]}`);
		}
	}

	return runArr;
};

const helpers = {
	...commonHelpers,
	colorRating,
	leagueUrl,
	plusMinus,
	roundStat,
	yearRanges,
};

export default helpers;
