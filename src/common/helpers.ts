// This should never be directly imported. Instead, ui/util/helpers and ui/worker/helpers should be used.
import type { TeamBasic, PlayerWithoutKey } from "./types";
import getTeamInfos from "./getTeamInfos";
import orderBy from "lodash/orderBy";

const getPopRanks = (
	teamSeasons: {
		pop?: number;
		tid: number;
	}[],
): number[] => {
	const teamsSorted = orderBy(teamSeasons, "pop", "desc");

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
			throw new Error("No rank found");
		}

		return (startRank + endRank) / 2;
	});
};

function addPopRank<T extends { pop?: number; tid: number }>(
	teams: T[],
): (T & { popRank: number })[] {
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
	let teams: Omit<TeamBasic, "popRank">[];
	if (process.env.SPORT === "basketball") {
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
	} else {
		teams = getTeamInfos([
			{
				tid: 0,
				cid: 1,
				did: 6,

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
				cid: 0,
				did: 0,

				abbrev: "BOS",
			},
			{
				tid: 3,
				cid: 1,
				did: 5,

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
				did: 4,

				abbrev: "DAL",
			},
			{
				tid: 7,
				cid: 0,
				did: 3,

				abbrev: "DEN",
			},
			{
				tid: 8,
				cid: 1,
				did: 5,

				abbrev: "DET",
			},
			{
				tid: 9,
				cid: 0,
				did: 2,

				abbrev: "HOU",
			},
			{
				tid: 10,
				cid: 0,
				did: 2,

				abbrev: "KC",
			},
			{
				tid: 11,
				cid: 0,
				did: 2,

				abbrev: "LV",
			},
			{
				tid: 12,
				cid: 1,
				did: 7,

				abbrev: "LA",
			},
			{
				tid: 13,
				cid: 1,
				did: 6,

				abbrev: "MXC",
			},
			{
				tid: 14,
				cid: 0,
				did: 0,

				abbrev: "MIA",
			},
			{
				tid: 15,
				cid: 1,
				did: 5,

				abbrev: "MIN",
			},
			{
				tid: 16,
				cid: 0,
				did: 1,

				abbrev: "MON",
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
				cid: 0,
				did: 2,

				abbrev: "PHO",
			},
			{
				tid: 20,
				cid: 0,
				did: 0,

				abbrev: "PIT",
			},
			{
				tid: 21,
				cid: 0,
				did: 3,

				abbrev: "POR",
			},
			{
				tid: 22,
				cid: 1,
				did: 7,

				abbrev: "SAC",
			},
			{
				tid: 23,
				cid: 1,
				did: 6,

				abbrev: "SA",
			},
			{
				tid: 24,
				cid: 0,
				did: 3,

				abbrev: "SD",
			},
			{
				tid: 25,
				cid: 1,
				did: 7,

				abbrev: "SF",
			},
			{
				tid: 26,
				cid: 1,
				did: 7,

				abbrev: "SEA",
			},
			{
				tid: 27,
				cid: 1,
				did: 5,

				abbrev: "STL",
			},
			{
				tid: 28,
				cid: 1,
				did: 6,

				abbrev: "TPA",
			},
			{
				tid: 29,
				cid: 0,
				did: 1,

				abbrev: "TOR",
			},
			{
				tid: 30,
				cid: 0,
				did: 3,

				abbrev: "VAN",
			},
			{
				tid: 31,
				cid: 1,
				did: 4,

				abbrev: "WAS",
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

	// @ts-ignore
	if (obj.constructor === RegExp) {
		return obj;
	}

	// @ts-ignore
	const retVal = new obj.constructor();

	for (const key of Object.keys(obj)) {
		// @ts-ignore
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
function leagueUrlFactory(
	lid: number,
	components: (number | string)[],
): string {
	let url = `/l/${lid}`;

	for (let i = 0; i < components.length; i++) {
		if (components[i] !== undefined) {
			url += `/${components[i]}`;
		}
	}

	return url;
}

/**
 * Format a number as currency, correctly handling negative values.
 *
 * @memberOf util.helpers
 * @param {number} amount Input value.
 * @param {string=} append Suffix to append to the number, like "M" for things like $2M.
 * @param {number|string|undefined} precision Number of decimal places. Default is 2 (like $17.62).
 * @return {string} Formatted currency string.
 */
function formatCurrency(
	amount: number,
	append: string = "",
	precision: number = 2,
): string {
	const sign = amount < 0 ? "-" : "";
	let abs = Math.abs(amount);

	if (abs === 0) {
		return "$0";
	}

	if (append === "M" && abs > 1000) {
		abs /= 1000;
		append = "B";
	}

	if (append === "M" && abs < 1 && abs !== 0) {
		abs *= 1000;
		append = "k";
		precision = 0;
	}

	let numberString = abs.toFixed(precision);

	// Remove last digits if 0
	for (let i = 0; i < precision; i++) {
		if (numberString[numberString.length - 1] === "0") {
			numberString = numberString.slice(0, -1);
		}
	}
	if (numberString[numberString.length - 1] === ".") {
		numberString = numberString.slice(0, -1);
	}

	return `${sign}$${numberString}${append}`;
}

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

// Format a number as an integer with commas in the thousands places.
const numberWithCommas = (x: number | string): string => {
	const y = typeof x === "string" ? parseFloat(x) : x;

	return y.toLocaleString("en-US", { maximumFractionDigits: 10 });
};

function yearRanges(arr: number[]): string[] {
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
}

function roundWinp(winp: number): string {
	let output = winp.toFixed(3);

	if (output[0] === "0") {
		// Delete leading 0
		output = output.slice(1, output.length);
	} else if (output[0] !== "-") {
		// Delete trailing digit if positive and no leading 0
		output = output.slice(0, output.length - 1);
	}

	return output;
}

const upperCaseFirstLetter = (string: string): string => {
	return `${string.charAt(0).toUpperCase()}${string.slice(1)}`;
};

// https://medium.com/@_achou/dont-give-up-and-use-suppressimplicitanyindexerrors-ca6b208b9365
// eslint-disable-next-line @typescript-eslint/ban-types
const keys = <O extends object>(obj: O): Array<keyof O> => {
	return Object.keys(obj) as Array<keyof O>;
};

const validateRoundsByes = (
	numRounds: number,
	numPlayoffByes: number,
	numActiveTeams: number,
) => {
	if (numRounds < 1) {
		throw new Error("Must have at least one round of playoffs");
	}

	if (numPlayoffByes < 0) {
		throw new Error("Cannot have a negative number of byes");
	}

	if (numRounds === 1 && numPlayoffByes > 0) {
		throw new Error("You cannoy have any byes in a one round playoff.");
	}

	const numPlayoffTeams = 2 ** numRounds - numPlayoffByes;

	if (numPlayoffTeams > numActiveTeams) {
		throw new Error(
			`${numRounds} playoff rounds with ${numPlayoffByes} first round byes means ${numPlayoffTeams} teams make the playoffs, but there are only ${numActiveTeams} teams in the league`,
		);
	}

	let numTeamsSecondRound;
	if (numRounds === 1) {
		// Becuase there is no second round!
		numTeamsSecondRound = 0;
	} else {
		numTeamsSecondRound = 2 ** (numRounds - 1);
	}

	if (numTeamsSecondRound < numPlayoffByes) {
		throw new Error(
			`With ${numRounds} playoff rounds, you need ${numTeamsSecondRound} teams in the second round, so it's not possible to have ${numPlayoffByes} first round byes`,
		);
	}
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

const isAmerican = (loc: string) => {
	if (loc.endsWith("USA")) {
		return true;
	}

	const parts = loc.split(", ");
	const state = parts[parts.length - 1];
	return states.includes(state);
};

const getCountry = (p: { born: { loc: string } }) => {
	let name = p.born.loc && p.born.loc !== "" ? p.born.loc : "None";

	if (isAmerican(name)) {
		name = "USA";
	} else {
		const parts = name.split(", ");
		if (parts.length > 1) {
			name = parts[parts.length - 1];
		}
	}

	return name;
};

const getJerseyNumber = (
	p: PlayerWithoutKey,
	type: "mostCommon" | "current" = "current",
): string | undefined => {
	if (type === "current") {
		if (p.stats.length > 0) {
			return p.stats[p.stats.length - 1].jerseyNumber;
		}

		// For uploaded league files
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
): string => {
	const playoffsByConference = numConfs === 2;

	if (playoffRoundsWon === numPlayoffRounds) {
		return "League champs";
	}

	if (playoffRoundsWon === numPlayoffRounds - 1) {
		return playoffsByConference ? "Conference champs" : "Made finals";
	}

	if (playoffRoundsWon === 0) {
		return "Made playoffs";
	}

	if (playoffRoundsWon === numPlayoffRounds - 2) {
		return playoffsByConference ? "Made conference finals" : "Made semifinals";
	}

	if (playoffRoundsWon === numPlayoffRounds - 3) {
		return playoffsByConference
			? "Made conference semifinals"
			: "Made quarterfinals";
	}

	if (playoffRoundsWon >= 1) {
		return `Made ${ordinal(playoffRoundsWon + 1)} round`;
	}

	return "";
};

export default {
	addPopRank,
	getPopRanks,
	gameScore,
	getCountry,
	getJerseyNumber,
	getTeamsDefault,
	deepCopy,
	formatCurrency,
	isAmerican,
	bound,
	leagueUrlFactory,
	numberWithCommas,
	ordinal,
	yearRanges,
	roundWinp,
	upperCaseFirstLetter,
	keys,
	validateRoundsByes,
	roundsWonText,
};
