// This should never be directly imported. Instead, ui/util/helpers and ui/worker/helpers should be used.
import type { TeamBasic, PlayerWithoutKey } from "./types";
import getTeamInfos from "./getTeamInfos";
import orderBy from "lodash-es/orderBy";
import isSport from "./isSport";

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
	if (isSport("basketball")) {
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
				did: 0,
				abbrev: "BOS",
			},
			{
				tid: 1,
				cid: 0,
				did: 1,
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
				abbrev: "LA",
			},
			{
				tid: 11,
				cid: 1,
				did: 3,
				abbrev: "LV",
			},
			{
				tid: 12,
				cid: 1,
				did: 2,
				abbrev: "MEM",
			},
			{
				tid: 13,
				cid: 0,
				did: 0,
				abbrev: "MIA",
			},
			{
				tid: 14,
				cid: 1,
				did: 2,
				abbrev: "MIL",
			},
			{
				tid: 15,
				cid: 1,
				did: 2,
				abbrev: "MIN",
			},
			{
				tid: 16,
				cid: 0,
				did: 0,
				abbrev: "MON",
			},
			{
				tid: 17,
				cid: 0,
				did: 1,
				abbrev: "NYC",
			},
			{
				tid: 18,
				cid: 0,
				did: 0,
				abbrev: "OTT",
			},
			{
				tid: 19,
				cid: 0,
				did: 1,
				abbrev: "PHI",
			},
			{
				tid: 20,
				cid: 1,
				did: 2,
				abbrev: "PHO",
			},
			{
				tid: 21,
				cid: 0,
				did: 1,
				abbrev: "PIT",
			},
			{
				tid: 22,
				cid: 1,
				did: 3,
				abbrev: "POR",
			},
			{
				tid: 23,
				cid: 1,
				did: 3,
				abbrev: "SD",
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
				abbrev: "VB",
			},
			{
				tid: 31,
				cid: 0,
				did: 1,
				abbrev: "WAS",
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

	// @ts-expect-error
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
function leagueUrlFactory(
	lid: number,
	components: (number | string | undefined)[],
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

	// Keep in sync with getSortVal
	if (append === "M" && abs > 1000) {
		abs /= 1000;
		append = "B";

		if (abs > 1000) {
			abs /= 1000;
			append = "T";

			if (abs > 1000) {
				abs /= 1000;
				append = "Q";
			}
		}
	}

	if (append === "M" && abs < 1 && abs !== 0) {
		abs *= 1000;
		append = "k";
		precision = 0;
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

const isAmerican = (loc: string) => {
	if (loc.endsWith("USA")) {
		return true;
	}

	const parts = loc.split(", ");
	const state = parts.at(-1);

	if (state === "Georgia") {
		return false;
	}

	return states.includes(state);
};

const getCountry = (bornLoc?: string) => {
	let name = bornLoc && bornLoc !== "" ? bornLoc : "None";

	if (isAmerican(name)) {
		name = "USA";
	} else {
		// Find part after last comma/colon
		for (const delimiter of [", ", ": "]) {
			const parts = name.split(delimiter);
			if (parts.length > 1) {
				name = parts.at(-1);
			}
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

	return "";
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

// There are a bunch of places where formatRecord is not used and it's done manually :(
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
};
