// This should never be directly imported. Instead, ui/util/helpers and ui/worker/helpers should be used.
import type {
	TeamBasic,
	Phase,
	PlayerContract,
	GameAttributesLeague,
	RelativeType,
} from "./types";
import getTeamInfos from "./getTeamInfos";
import orderBy from "lodash-es/orderBy";
import isSport from "./isSport";
import { PHASE } from "./constants";

const getPopRanks = (
	teamSeasons: {
		// If these are teamSeason objects, disabled teams won't even have one. If these are some other kind of team object, disabled teams might be there.
		disabled?: boolean;
		pop?: number;
		tid: number;
	}[],
): number[] => {
	const teamsFiltered = teamSeasons.filter(t => !t.disabled);

	const teamsSorted = orderBy(teamsFiltered, "pop", "desc");

	return teamSeasons.map(t => {
		// Find the starting and ending ranks of all teams tied with the current team (if no tie, then startRank and endRank will be the same)
		let startRank;
		let endRank;
		for (let i = 0; i < teamsSorted.length; i++) {
			const t2 = teamsSorted[i];
			if (t2.pop === t.pop || t2.tid === t.tid) {
				if (startRank === undefined) {
					startRank = i + 1;
				}
				endRank = i + 1;
			}
		}

		if (startRank === undefined || endRank === undefined) {
			// For disabled teams
			return teamsFiltered.length + 1;
		}

		return (startRank + endRank) / 2;
	});
};

function addPopRank<
	T extends { disabled?: boolean; pop?: number; tid: number },
>(teams: T[]): (T & { popRank: number })[] {
	const popRanks = getPopRanks(teams);

	return teams.map((t, i) => ({
		...t,
		popRank: popRanks[i],
	}));
}

const gameScore = (arg: { [key: string]: number }): number => {
	return (
		arg.pts +
		0.4 * arg.fg -
		0.7 * arg.fga -
		0.4 * (arg.fta - arg.ft) +
		0.7 * arg.orb +
		0.3 * arg.drb +
		arg.stl +
		0.7 * arg.ast +
		0.7 * arg.blk -
		0.4 * arg.pf -
		arg.tov
	);
};

function getTeamsDefault(): TeamBasic[] {
	let teams: TeamBasic[];
	if (isSport("baseball")) {
		teams = getTeamInfos([
			{
				tid: 0,
				cid: 1,
				did: 3,
				abbrev: "ATL",
			},
			{
				tid: 1,
				cid: 0,
				did: 0,
				abbrev: "BAL",
			},
			{
				tid: 2,
				cid: 1,
				did: 3,
				abbrev: "BKN",
			},
			{
				tid: 3,
				cid: 0,
				did: 0,
				abbrev: "BOS",
			},
			{
				tid: 4,
				cid: 1,
				did: 4,
				abbrev: "CHI",
			},
			{
				tid: 5,
				cid: 1,
				did: 4,
				abbrev: "CIN",
			},
			{
				tid: 6,
				cid: 0,
				did: 1,
				abbrev: "CLE",
			},
			{
				tid: 7,
				cid: 0,
				did: 2,
				abbrev: "DAL",
			},
			{
				tid: 8,
				cid: 1,
				did: 5,
				abbrev: "DEN",
			},
			{
				tid: 9,
				cid: 0,
				did: 1,
				abbrev: "DET",
			},
			{
				tid: 10,
				cid: 0,
				did: 2,
				abbrev: "HOU",
			},
			{
				tid: 11,
				cid: 0,
				did: 1,
				abbrev: "IND",
			},
			{
				tid: 12,
				cid: 0,
				did: 1,
				abbrev: "KC",
			},
			{
				tid: 13,
				cid: 0,
				did: 2,
				abbrev: "LAE",
			},
			{
				tid: 14,
				cid: 1,
				did: 5,
				abbrev: "LAL",
			},
			{
				tid: 15,
				cid: 1,
				did: 3,
				abbrev: "MIA",
			},
			{
				tid: 16,
				cid: 1,
				did: 4,
				abbrev: "MIL",
			},
			{
				tid: 17,
				cid: 0,
				did: 1,
				abbrev: "MIN",
			},
			{
				tid: 18,
				cid: 0,
				did: 0,
				abbrev: "NYC",
			},
			{
				tid: 19,
				cid: 0,
				did: 2,
				abbrev: "OAK",
			},
			{
				tid: 20,
				cid: 1,
				did: 3,
				abbrev: "PHI",
			},
			{
				tid: 21,
				cid: 1,
				did: 5,
				abbrev: "PHO",
			},
			{
				tid: 22,
				cid: 1,
				did: 4,
				abbrev: "PIT",
			},
			{
				tid: 23,
				cid: 1,
				did: 5,
				abbrev: "SD",
			},
			{
				tid: 24,
				cid: 0,
				did: 2,
				abbrev: "SEA",
			},
			{
				tid: 25,
				cid: 1,
				did: 5,
				abbrev: "SF",
			},
			{
				tid: 26,
				cid: 1,
				did: 4,
				abbrev: "STL",
			},
			{
				tid: 27,
				cid: 0,
				did: 0,
				abbrev: "TOR",
			},
			{
				tid: 28,
				cid: 0,
				did: 0,
				abbrev: "TPA",
			},
			{
				tid: 29,
				cid: 1,
				did: 3,
				abbrev: "WAS",
			},
		]);
	} else if (isSport("basketball")) {
		teams = getTeamInfos([
			{
				tid: 0,
				cid: 0,
				did: 2,

				abbrev: "ATL",
			},
			{
				tid: 1,
				cid: 0,
				did: 2,

				abbrev: "BAL",
			},
			{
				tid: 2,
				cid: 0,
				did: 0,

				abbrev: "BOS",
			},
			{
				tid: 3,
				cid: 0,
				did: 1,

				abbrev: "CHI",
			},
			{
				tid: 4,
				cid: 0,
				did: 1,

				abbrev: "CIN",
			},
			{
				tid: 5,
				cid: 0,
				did: 1,

				abbrev: "CLE",
			},
			{
				tid: 6,
				cid: 1,
				did: 3,

				abbrev: "DAL",
			},
			{
				tid: 7,
				cid: 1,
				did: 4,

				abbrev: "DEN",
			},
			{
				tid: 8,
				cid: 0,
				did: 1,

				abbrev: "DET",
			},
			{
				tid: 9,
				cid: 1,
				did: 3,

				abbrev: "HOU",
			},
			{
				tid: 10,
				cid: 1,
				did: 5,

				abbrev: "LV",
			},
			{
				tid: 11,
				cid: 1,
				did: 5,

				abbrev: "LA",
			},
			{
				tid: 12,
				cid: 1,
				did: 3,

				abbrev: "MXC",
			},
			{
				tid: 13,
				cid: 0,
				did: 2,

				abbrev: "MIA",
			},
			{
				tid: 14,
				cid: 1,
				did: 4,

				abbrev: "MIN",
			},
			{
				tid: 15,
				cid: 0,
				did: 0,

				abbrev: "MON",
			},
			{
				tid: 16,
				cid: 0,
				did: 0,

				abbrev: "NYC",
			},
			{
				tid: 17,
				cid: 0,
				did: 0,

				abbrev: "PHI",
			},
			{
				tid: 18,
				cid: 1,
				did: 3,

				abbrev: "PHO",
			},
			{
				tid: 19,
				cid: 0,
				did: 1,

				abbrev: "PIT",
			},
			{
				tid: 20,
				cid: 1,
				did: 4,

				abbrev: "POR",
			},
			{
				tid: 21,
				cid: 1,
				did: 5,

				abbrev: "SAC",
			},
			{
				tid: 22,
				cid: 1,
				did: 5,

				abbrev: "SD",
			},
			{
				tid: 23,
				cid: 1,
				did: 5,

				abbrev: "SF",
			},
			{
				tid: 24,
				cid: 1,
				did: 4,

				abbrev: "SEA",
			},
			{
				tid: 25,
				cid: 1,
				did: 3,

				abbrev: "STL",
			},
			{
				tid: 26,
				cid: 0,
				did: 2,

				abbrev: "TPA",
			},
			{
				tid: 27,
				cid: 0,
				did: 0,

				abbrev: "TOR",
			},
			{
				tid: 28,
				cid: 1,
				did: 4,

				abbrev: "VAN",
			},
			{
				tid: 29,
				cid: 0,
				did: 2,

				abbrev: "WAS",
			},
		]);
	} else if (isSport("hockey")) {
		teams = getTeamInfos([
			{
				tid: 0,
				cid: 0,
				did: 1,
				abbrev: "BKN",
			},
			{
				tid: 1,
				cid: 0,
				did: 0,
				abbrev: "BOS",
			},
			{
				tid: 2,
				cid: 0,
				did: 0,
				abbrev: "BUF",
			},
			{
				tid: 3,
				cid: 1,
				did: 3,
				abbrev: "CGY",
			},
			{
				tid: 4,
				cid: 0,
				did: 1,
				abbrev: "CHA",
			},
			{
				tid: 5,
				cid: 1,
				did: 2,
				abbrev: "CHI",
			},
			{
				tid: 6,
				cid: 0,
				did: 1,
				abbrev: "CIN",
			},
			{
				tid: 7,
				cid: 1,
				did: 2,
				abbrev: "DAL",
			},
			{
				tid: 8,
				cid: 1,
				did: 2,
				abbrev: "DEN",
			},
			{
				tid: 9,
				cid: 0,
				did: 0,
				abbrev: "DET",
			},
			{
				tid: 10,
				cid: 1,
				did: 3,
				abbrev: "EDM",
			},
			{
				tid: 11,
				cid: 1,
				did: 3,
				abbrev: "LAL",
			},
			{
				tid: 12,
				cid: 1,
				did: 3,
				abbrev: "LAE",
			},
			{
				tid: 13,
				cid: 1,
				did: 3,
				abbrev: "LV",
			},
			{
				tid: 14,
				cid: 1,
				did: 2,
				abbrev: "MEM",
			},
			{
				tid: 15,
				cid: 0,
				did: 0,
				abbrev: "MIA",
			},
			{
				tid: 16,
				cid: 1,
				did: 2,
				abbrev: "MIN",
			},
			{
				tid: 17,
				cid: 0,
				did: 0,
				abbrev: "MON",
			},
			{
				tid: 18,
				cid: 0,
				did: 1,
				abbrev: "NJ",
			},
			{
				tid: 19,
				cid: 0,
				did: 1,
				abbrev: "NYC",
			},
			{
				tid: 20,
				cid: 0,
				did: 0,
				abbrev: "OTT",
			},
			{
				tid: 21,
				cid: 0,
				did: 1,
				abbrev: "PHI",
			},
			{
				tid: 22,
				cid: 1,
				did: 2,
				abbrev: "PHO",
			},
			{
				tid: 23,
				cid: 0,
				did: 1,
				abbrev: "PIT",
			},
			{
				tid: 24,
				cid: 1,
				did: 3,
				abbrev: "SJ",
			},
			{
				tid: 25,
				cid: 1,
				did: 3,
				abbrev: "SEA",
			},
			{
				tid: 26,
				cid: 1,
				did: 2,
				abbrev: "STL",
			},
			{
				tid: 27,
				cid: 0,
				did: 0,
				abbrev: "TPA",
			},
			{
				tid: 28,
				cid: 0,
				did: 0,
				abbrev: "TOR",
			},
			{
				tid: 29,
				cid: 1,
				did: 3,
				abbrev: "VAN",
			},
			{
				tid: 30,
				cid: 0,
				did: 1,
				abbrev: "WAS",
			},
			{
				tid: 31,
				cid: 1,
				did: 2,
				abbrev: "WPG",
			},
		]);
	} else {
		teams = getTeamInfos([
			{
				tid: 0,
				cid: 0,
				did: 0,
				abbrev: "BOS",
			},
			{
				tid: 1,
				cid: 0,
				did: 0,
				abbrev: "BKN",
			},
			{
				tid: 2,
				cid: 0,
				did: 0,
				abbrev: "BUF",
			},
			{
				tid: 3,
				cid: 0,
				did: 0,
				abbrev: "MIA",
			},

			{
				tid: 4,
				cid: 0,
				did: 1,
				abbrev: "BAL",
			},
			{
				tid: 5,
				cid: 0,
				did: 1,
				abbrev: "CIN",
			},
			{
				tid: 6,
				cid: 0,
				did: 1,
				abbrev: "CLE",
			},
			{
				tid: 7,
				cid: 0,
				did: 1,
				abbrev: "PIT",
			},

			{
				tid: 8,
				cid: 0,
				did: 2,
				abbrev: "HOU",
			},
			{
				tid: 9,
				cid: 0,
				did: 2,
				abbrev: "IND",
			},
			{
				tid: 10,
				cid: 0,
				did: 2,
				abbrev: "JAX",
			},
			{
				tid: 11,
				cid: 0,
				did: 2,
				abbrev: "MEM",
			},

			{
				tid: 12,
				cid: 0,
				did: 3,
				abbrev: "DEN",
			},
			{
				tid: 13,
				cid: 0,
				did: 3,
				abbrev: "KC",
			},
			{
				tid: 14,
				cid: 0,
				did: 3,
				abbrev: "LAE",
			},
			{
				tid: 15,
				cid: 0,
				did: 3,
				abbrev: "LV",
			},

			{
				tid: 16,
				cid: 1,
				did: 4,
				abbrev: "DAL",
			},
			{
				tid: 17,
				cid: 1,
				did: 4,
				abbrev: "NYC",
			},
			{
				tid: 18,
				cid: 1,
				did: 4,
				abbrev: "PHI",
			},
			{
				tid: 19,
				cid: 1,
				did: 4,
				abbrev: "WAS",
			},

			{
				tid: 20,
				cid: 1,
				did: 5,
				abbrev: "CHI",
			},
			{
				tid: 21,
				cid: 1,
				did: 5,
				abbrev: "DET",
			},
			{
				tid: 22,
				cid: 1,
				did: 5,
				abbrev: "MIL",
			},
			{
				tid: 23,
				cid: 1,
				did: 5,
				abbrev: "MIN",
			},

			{
				tid: 24,
				cid: 1,
				did: 6,
				abbrev: "ATL",
			},
			{
				tid: 25,
				cid: 1,
				did: 6,
				abbrev: "CHA",
			},
			{
				tid: 26,
				cid: 1,
				did: 6,
				abbrev: "NOL",
			},
			{
				tid: 27,
				cid: 1,
				did: 6,
				abbrev: "TPA",
			},

			{
				tid: 28,
				cid: 1,
				did: 7,
				abbrev: "LA",
			},
			{
				tid: 29,
				cid: 1,
				did: 7,
				abbrev: "PHO",
			},
			{
				tid: 30,
				cid: 1,
				did: 7,
				abbrev: "SEA",
			},
			{
				tid: 31,
				cid: 1,
				did: 7,
				abbrev: "SF",
			},
		]);
	}

	return teams;
}

/**
 * Clones an object.
 *
 * Taken from http://stackoverflow.com/a/3284324/786644
 */
function deepCopy<T>(obj: T): T {
	if (typeof obj !== "object" || obj === null) {
		return obj;
	}

	if (obj.constructor === RegExp) {
		return obj;
	}

	// @ts-expect-error
	const retVal = new obj.constructor();

	for (const key of Object.keys(obj)) {
		// @ts-expect-error
		retVal[key] = deepCopy(obj[key]);
	}

	return retVal;
}

/**
 * Create a URL for a page within a league.
 *
 * @param {Array.<string|number>} components Array of components for the URL after the league ID, which will be combined with / in between.
 * @return {string} URL
 */
const leagueUrlFactory = (
	lid: number,
	components: (number | string | undefined)[],
) => {
	let url = `/l/${lid}`;

	for (let i = 0; i < components.length; i++) {
		if (components[i] !== undefined) {
			url += `/${components[i]}`;
		}
	}

	return url;
};

/**
 * Format a number as currency, correctly handling negative values.
 *
 * @memberOf util.helpers
 * @param {number} amount Input value.
 * @param {string=} append Suffix to append to the number, like "M" for things like $2M.
 * @param {number|string|undefined} precision Number of decimal places. Default is 2 (like $17.62).
 * @return {string} Formatted currency string.
 */
const formatCurrency = (
	amount: number,
	initialUnits: "M" | "" = "",
	precision: number = 2,
) => {
	const baseExponent = initialUnits === "M" ? 6 : 0; // Input unit is in millions

	const sign = amount < 0 ? "-" : "";
	let abs = Math.abs(amount);

	if (abs === 0) {
		return "$0";
	}

	let append = "";

	// Keep in sync with getSortVal
	if (abs >= 1000) {
		const currencySuffixes = ["", "k", "M", "B", "T", "Q"];

		const exponent = Math.floor(Math.log10(abs));
		const suffixIndex = Math.floor((exponent + baseExponent) / 3);
		if (suffixIndex < currencySuffixes.length) {
			append = currencySuffixes[suffixIndex];
			abs /= 1000 ** (suffixIndex - baseExponent / 3);
		} else {
			// Scientific notation
			append = `e${exponent + baseExponent}`;
			abs /= 10 ** exponent;
		}
	} else if (abs < 1) {
		abs *= 1000;
		append = "k";
		precision = 0;
	} else {
		// No scaling needed!
		append = initialUnits;
	}

	let numberString = abs.toFixed(precision);

	// Remove last digits if 0
	if (append !== "") {
		for (let i = 0; i < precision; i++) {
			if (numberString.at(-1) === "0") {
				numberString = numberString.slice(0, -1);
			}
		}
		if (numberString.at(-1) === ".") {
			numberString = numberString.slice(0, -1);
		}
	}

	return `${sign}$${numberString}${append}`;
};

/**
 * Bound a number so that it can't exceed min and max values.
 *
 * @memberOf util.helpers
 * @param {number} x Input number.
 * @param {number} min Minimum bounding variable.
 * @param {number} max Maximum bounding variable.
 * @return {number} Bounded number.
 */
function bound(x: number, min: number, max: number): number {
	if (x < min) {
		return min;
	}

	if (x > max) {
		return max;
	}

	return x;
}

function ordinal(x?: number | null): string {
	if (x === undefined || x === null) {
		return "";
	}

	let suffix;

	if (x % 100 >= 11 && x % 100 <= 13) {
		suffix = "th";
	} else if (x % 10 === 1) {
		suffix = "st";
	} else if (x % 10 === 2) {
		suffix = "nd";
	} else if (x % 10 === 3) {
		suffix = "rd";
	} else {
		suffix = "th";
	}

	return x.toString() + suffix;
}

// On iOS in some locales, the inputMode="decimal" keyboard contians a , as the decimal separator rather than .
const localeParseFloat = (string: string) => {
	return parseFloat(
		typeof string === "string" ? string.replaceAll(",", ".") : string,
	);
};

// Format a number as an integer with commas in the thousands places.
const numberWithCommas = (x: number | string): string => {
	const y = typeof x === "string" ? localeParseFloat(x) : x;

	return y.toLocaleString("en-US", { maximumFractionDigits: 10 });
};

const roundWinp = (winp: number): string => {
	let output = winp.toFixed(3);

	if (output[0] === "0") {
		// Delete leading 0
		output = output.slice(1, output.length);
	} else if (output === "1.000") {
		// 1.000 => 1.00, but for higher numbers leave 3 decimal places, like for OPS
		output = "1.00";
	}

	return output;
};

const upperCaseFirstLetter = <T extends string>(string: T) => {
	return `${string.charAt(0).toUpperCase()}${string.slice(1)}` as Capitalize<T>;
};

// https://medium.com/@_achou/dont-give-up-and-use-suppressimplicitanyindexerrors-ca6b208b9365
// eslint-disable-next-line @typescript-eslint/ban-types
const keys = <O extends object>(obj: O): Array<keyof O> => {
	return Object.keys(obj) as Array<keyof O>;
};

const states = [
	"AL",
	"AK",
	"AZ",
	"AR",
	"CA",
	"CO",
	"CT",
	"DC",
	"DE",
	"FL",
	"GA",
	"HI",
	"ID",
	"IL",
	"IN",
	"IA",
	"KS",
	"KY",
	"LA",
	"ME",
	"MD",
	"MA",
	"MI",
	"MN",
	"MS",
	"MO",
	"MT",
	"NE",
	"NV",
	"NH",
	"NJ",
	"NM",
	"NY",
	"NC",
	"ND",
	"OH",
	"OK",
	"OR",
	"PA",
	"RI",
	"SC",
	"SD",
	"TN",
	"TX",
	"UT",
	"VT",
	"VA",
	"WA",
	"WV",
	"WI",
	"WY",
	"Alabama",
	"Alaska",
	"Arizona",
	"Arkansas",
	"California",
	"Colorado",
	"Connecticut",
	"Delaware",
	"Florida",
	"Georgia",
	"Hawaii",
	"Idaho",
	"Illinois",
	"Indiana",
	"Iowa",
	"Kansas",
	"Kentucky",
	"Louisiana",
	"Maine",
	"Maryland",
	"Massachusetts",
	"Michigan",
	"Minnesota",
	"Mississippi",
	"Missouri",
	"Montana",
	"Nebraska",
	"Nevada",
	"New Hampshire",
	"New Jersey",
	"New Mexico",
	"New York",
	"North Carolina",
	"North Dakota",
	"Ohio",
	"Oklahoma",
	"Oregon",
	"Pennsylvania",
	"Rhode Island",
	"South Carolina",
	"South Dakota",
	"Tennessee",
	"Texas",
	"Utah",
	"Vermont",
	"Virginia",
	"Washington",
	"West Virginia",
	"Wisconsin",
	"Wyoming",
	"District of Columbia",
];

const provinces = [
	"Ontario",
	"Quebec",
	"Nova Scotia",
	"New Brunswick",
	"Manitoba",
	"British Columbia",
	"Prince Edward Island",
	"Saskatchewan",
	"Alberta",
	"Newfoundland and Labrador",
];

const isAmerican = (loc: string) => {
	if (loc.endsWith("USA")) {
		return true;
	}

	const parts = loc.split(", ");
	const state = parts.at(-1);

	if (state === "Georgia" || state === undefined) {
		return false;
	}

	return states.includes(state);
};

const isCanadian = (loc: string) => {
	if (loc.endsWith("Canada")) {
		return true;
	}

	const parts = loc.split(", ");
	const province = parts.at(-1);

	if (province === undefined) {
		return false;
	}

	return provinces.includes(province);
};

const getCountry = (bornLoc?: string) => {
	let name = bornLoc && bornLoc !== "" ? bornLoc : "None";

	if (isAmerican(name)) {
		name = "USA";
	} else if (isCanadian(name)) {
		name = "Canada";
	} else {
		// Find part after last comma/colon
		for (const delimiter of [", ", ": "]) {
			const parts = name.split(delimiter);
			const nameTemp = parts.at(-1);
			if (nameTemp !== undefined) {
				name = nameTemp;
			}
		}
	}

	return name;
};

const getJerseyNumber = (
	p: {
		jerseyNumber?: string;
		stats: any[];
	},
	type: "mostCommon" | "current" = "current",
): string | undefined => {
	if (type === "current") {
		if (p.stats.length > 0) {
			return p.stats.at(-1).jerseyNumber;
		}

		// For uploaded league files, or real players leagues with no old stats (with new old stats, relies on augmentPartialPlayer to set jerseyNumber from root in latest stats row)
		return p.jerseyNumber;
	}

	// Find most common from career
	const numSeasonsByJerseyNumber: Record<string, number> = {};
	let max = 0;
	for (const { jerseyNumber } of p.stats) {
		if (jerseyNumber === undefined) {
			continue;
		}
		if (numSeasonsByJerseyNumber[jerseyNumber] === undefined) {
			numSeasonsByJerseyNumber[jerseyNumber] = 1;
		} else {
			numSeasonsByJerseyNumber[jerseyNumber] += 1;
		}

		if (numSeasonsByJerseyNumber[jerseyNumber] > max) {
			max = numSeasonsByJerseyNumber[jerseyNumber];
		}
	}

	const entries = Object.entries(numSeasonsByJerseyNumber).reverse();
	const entry = entries.find(entry => entry[1] === max);
	if (entry) {
		return entry[0];
	}

	return undefined;
};

const roundsWonText = (
	playoffRoundsWon: number,
	numPlayoffRounds: number,
	numConfs: number,
	showMissedPlayoffs?: boolean,
): string => {
	const playoffsByConf = numConfs === 2;

	if (playoffRoundsWon === numPlayoffRounds) {
		return "League champs";
	}

	if (playoffRoundsWon === numPlayoffRounds - 1) {
		return playoffsByConf ? "Conference champs" : "Made finals";
	}

	if (playoffRoundsWon === 0) {
		return "Made playoffs";
	}

	if (playoffRoundsWon === numPlayoffRounds - 2) {
		return playoffsByConf ? "Made conference finals" : "Made semifinals";
	}

	if (playoffRoundsWon === numPlayoffRounds - 3) {
		return playoffsByConf ? "Made conference semifinals" : "Made quarterfinals";
	}

	if (playoffRoundsWon >= 1) {
		return `Made ${ordinal(playoffRoundsWon + 1)} round`;
	}

	return showMissedPlayoffs ? "Missed playoffs" : "";
};

// Based on the currnet number of active teams, the number of draft rounds, and the number of expansion teams, what is the minimum valid number for the max number of players that can be taken per team?
const getExpansionDraftMinimumPlayersPerActiveTeam = (
	numExpansionTeams: number,
	numDraftRounds: number,
	numActiveTeams: number,
) => {
	return Math.ceil(
		(Math.max(1, numExpansionTeams) * numDraftRounds) / numActiveTeams,
	);
};

const ratio = (numerator: number, denominator: number) => {
	if (denominator > 0) {
		return numerator / denominator;
	}

	return 0;
};

const percentage = (numerator: number, denominator: number) => {
	return 100 * ratio(numerator, denominator);
};

const formatRecord = ({
	won,
	lost,
	tied,
	otl,
}: {
	won: number;
	lost: number;
	tied?: number;
	otl?: number;
}) => {
	let record = `${won}-${lost}`;
	if (typeof otl === "number" && !Number.isNaN(otl) && otl > 0) {
		record += `-${otl}`;
	}
	if (typeof tied === "number" && !Number.isNaN(tied) && tied > 0) {
		record += `-${tied}`;
	}

	return record;
};

const overtimeText = (
	numOvertimes: number | undefined,
	numPeriods: number | undefined,
) => {
	let overtimes = "";

	if (numOvertimes !== undefined && numOvertimes > 0) {
		if (isSport("baseball")) {
			overtimes = `${(numPeriods ?? 0) + numOvertimes}`;
		} else {
			if (numOvertimes === 1) {
				overtimes = "OT";
			} else if (numOvertimes > 1) {
				overtimes = `${numOvertimes}OT`;
			}
		}
	}

	return overtimes;
};

const sum = (values: (number | undefined)[]) => {
	let total = 0;
	for (const value of values) {
		if (value !== undefined) {
			total += value;
		}
	}
	return total;
};

// If a player was just drafted and the regular season hasn't started, then he can be released without paying anything
const justDrafted = (
	p: {
		draft: {
			year: number;
		};
		contract: PlayerContract;
	},
	phase: Phase,
	season: number,
) => {
	return (
		!!p.contract.rookie &&
		((p.draft.year === season && phase >= PHASE.DRAFT) ||
			(p.draft.year === season - 1 &&
				phase < PHASE.REGULAR_SEASON &&
				phase >= 0))
	);
};

const getRelativeType = (
	gender: GameAttributesLeague["gender"],
	type: RelativeType | "grandfather" | "uncle" | "grandson" | "nephew",
) => {
	const isMale = gender === "male";

	switch (type) {
		case "brother":
			return isMale ? "Brother" : "Sister";
		case "son":
			return isMale ? "Son" : "Daughter";
		case "father":
			return isMale ? "Father" : "Mother";
		case "grandfather":
			return isMale ? "Grandfather" : "Grandmother";
		case "grandson":
			return isMale ? "Grandson" : "Granddaughter";
		case "nephew":
			return isMale ? "Nephew" : "Niece";
		case "uncle":
		default:
			return isMale ? "Uncle" : "Aunt";
	}
};

const pronoun = (
	gender: GameAttributesLeague["gender"],
	pronoun: "he" | "He" | "him" | "Him" | "his" | "His" | "himself" | "Himself",
) => {
	if (gender === "female") {
		switch (pronoun) {
			case "he":
				return "she";
			case "He":
				return "She";
			case "him":
				return "her";
			case "Him":
				return "Her";
			case "his":
				return "her";
			case "His":
				return "her";
			case "himself":
				return "herself";
			case "Himself":
				return "Herself";
			default:
				return "???";
		}
	}

	return pronoun;
};

const getRecordNumericValue = (record: string | null) => {
	if (record === null) {
		return -Infinity;
	}

	let [won, lost, otl, tied] = record.split("-").map(num => parseInt(num));

	// Technically, if only one of "tied" or "otl" is present, we can't distinguish. Assume it's tied, in that case.
	if (typeof otl === "number" && typeof tied !== "number") {
		tied = otl;
		otl = 0;
	}

	if (typeof otl !== "number") {
		otl = 0;
	}
	if (typeof tied !== "number") {
		tied = 0;
	}

	if (won + lost + otl + tied > 0) {
		// Sort by wins, winp
		return won + (won + 0.5 * tied) / (won + lost + otl + tied);
	}

	return 0;
};

export default {
	addPopRank,
	getPopRanks,
	gameScore,
	getCountry,
	getExpansionDraftMinimumPlayersPerActiveTeam,
	getJerseyNumber,
	getTeamsDefault,
	deepCopy,
	formatCurrency,
	isAmerican,
	bound,
	leagueUrlFactory,
	numberWithCommas,
	ordinal,
	roundWinp,
	upperCaseFirstLetter,
	keys,
	roundsWonText,
	ratio,
	percentage,
	formatRecord,
	overtimeText,
	sum,
	justDrafted,
	getRelativeType,
	pronoun,
	getRecordNumericValue,
	localeParseFloat,
};
