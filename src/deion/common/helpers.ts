// This should never be directly imported. Instead, ui/util/helpers and ui/worker/helpers should be used.
import type { TeamBasic } from "./types";

// Prefer getPopRanks to this in new code because it's not mutable
function addPopRank(teams: any[]): any[] {
	// Add popRank
	const teamsSorted = teams.slice();
	teamsSorted.sort((a, b) => b.pop - a.pop);

	for (let i = 0; i < teams.length; i++) {
		for (let j = 0; j < teamsSorted.length; j++) {
			if (teams[i].tid === teamsSorted[j].tid) {
				teams[i].popRank = j + 1;
				break;
			}
		}
	}

	return teams;
}

// Prefer this to addPopRank in new code because it's not mutable
const getPopRanks = (
	teamSeasons: {
		pop: number;
		tid: number;
	}[],
): number[] => {
	// Add popRank
	const teamsSorted = teamSeasons.slice();
	teamsSorted.sort((a, b) => b.pop - a.pop);
	const popRanks: number[] = [];

	for (let i = 0; i < teamSeasons.length; i++) {
		for (let j = 0; j < teamsSorted.length; j++) {
			if (teamSeasons[i].tid === teamsSorted[j].tid) {
				popRanks[i] = j + 1;
				break;
			}
		}
	}

	return popRanks;
};

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

function getTeamsDefault(realistic?: boolean): TeamBasic[] {
	const teamInfos: {
		[key: string]: {
			region: string;
			name: string;
			abbrev: string;
			pop: number;
			colors: [string, string, string];
		};
	} = {
		ATL: {
			region: "Atlanta",
			name: "Gold Club",
			abbrev: "ATL",
			pop: 4.3,
			colors: ["#5c4a99", "#f0e81c", "#211e1e"],
		},
		BAL: {
			region: "Baltimore",
			name: "Crabs",
			abbrev: "BAL",
			pop: 2.2,
			colors: ["#7a1319", "#89bfd3", "#07364f"],
		},
		BOS: {
			region: "Boston",
			name: "Massacre",
			abbrev: "BOS",
			pop: 4.2,
			colors: ["#0d435e", "#f0494a", "#cccccc"],
		},
		BKN: {
			region: "Brooklyn",
			name: "???",
			abbrev: "BKN",
			pop: 19.1,
			colors: ["#000000", "#cccccc", "#ffffff"],
		},
		CHA: {
			region: "Charlotte",
			name: "???",
			abbrev: "CHA",
			pop: 2.5,
			colors: ["#000000", "#cccccc", "#ffffff"],
		},
		CHI: {
			region: "Chicago",
			name: "Whirlwinds",
			abbrev: "CHI",
			pop: 8.6,
			colors: ["#ef670a", "#caeaf9", "#d3d3d3"],
		},
		CIN: {
			region: "Cincinnati",
			name: "Riots",
			abbrev: "CIN",
			pop: 1.6,
			colors: ["#000000", "#c11616", "#2966ef"],
		},
		CLE: {
			region: "Cleveland",
			name: "Curses",
			abbrev: "CLE",
			pop: 1.8,
			colors: ["#211e1e", "#f8e3cc", "#3f1c59"],
		},
		DAL: {
			region: "Dallas",
			name: "Snipers",
			abbrev: "DAL",
			pop: 5.1,
			colors: ["#be2026", "#2b2e81", "#ffffff"],
		},
		DEN: {
			region: "Denver",
			name: "High",
			abbrev: "DEN",
			pop: 2.4,
			colors: ["#216935", "#163a1c", "#a1d297"],
		},
		DET: {
			region: "Detroit",
			name: "Muscle",
			abbrev: "DET",
			pop: 3.7,
			colors: ["#3a5eab", "#708fc7", "#0a1130"],
		},
		HOU: {
			region: "Houston",
			name: "Apollos",
			abbrev: "HOU",
			pop: 4.9,
			colors: ["#4c91c2", "#c4c4c3", "#ffffff"],
		},
		IND: {
			region: "Indianapolis",
			name: "???",
			abbrev: "IND",
			pop: 2,
			colors: ["#000000", "#cccccc", "#ffffff"],
		},
		KC: {
			region: "Kansas City",
			name: "Sauce",
			abbrev: "KC",
			pop: 1.5,
			colors: ["#8f2100", "#ffb500", "#d4731c"],
		},
		LA: {
			region: "Los Angeles",
			name: "Earthquakes",
			abbrev: "LA",
			pop: 12.1,
			colors: ["#6b6b6b", "#f15d24", "#dedddd"],
		},
		LAL: {
			region: "Los Angeles",
			name: "???",
			abbrev: "LAL",
			pop: 12.1,
			colors: ["#000000", "#cccccc", "#ffffff"],
		},
		LV: {
			region: "Las Vegas",
			name: "Blue Chips",
			abbrev: "LV",
			pop: 1.9,
			colors: ["#1c73bb", "#ffd600", "#0c5983"],
		},
		MEM: {
			region: "Memphis",
			name: "???",
			abbrev: "MEM",
			pop: 1.3,
			colors: ["#000000", "#cccccc", "#ffffff"],
		},
		MIA: {
			region: "Miami",
			name: "Cyclones",
			abbrev: "MIA",
			pop: 5.5,
			colors: ["#d8519d", "#4ac1c0", "#f15949"],
		},
		MIL: {
			region: "Milwaukee",
			name: "???",
			abbrev: "MIL",
			pop: 1.6,
			colors: ["#000000", "#cccccc", "#ffffff"],
		},
		MIN: {
			region: "Minneapolis",
			name: "Blizzard",
			abbrev: "MIN",
			pop: 2.7,
			colors: ["#3d2971", "#8accdc", "#ed9a22"],
		},
		MON: {
			region: "Montreal",
			name: "Mounties",
			abbrev: "MON",
			pop: 4.0,
			colors: ["#eac494", "#ed1d3d", "#f2b316"],
		},
		MXC: {
			region: "Mexico City",
			name: "Aztecs",
			abbrev: "MXC",
			pop: 19.4,
			colors: ["#1a9190", "#510f0f", "#eb5924"],
		},
		NOL: {
			region: "New Orleans",
			name: "???",
			abbrev: "NOL",
			pop: 1.3,
			colors: ["#000000", "#cccccc", "#ffffff"],
		},
		NYC: {
			region: "New York",
			name: "Bankers",
			abbrev: "NYC",
			pop: 18.4,
			colors: ["#1e73ba", "#ff8500", "#ffffff"],
		},
		OKC: {
			region: "Oklahoma City",
			name: "???",
			abbrev: "OKC",
			pop: 1.4,
			colors: ["#000000", "#cccccc", "#ffffff"],
		},
		ORL: {
			region: "Orlando",
			name: "???",
			abbrev: "ORL",
			pop: 2.4,
			colors: ["#000000", "#cccccc", "#ffffff"],
		},
		PHI: {
			region: "Philadelphia",
			name: "Cheesesteaks",
			abbrev: "PHI",
			pop: 5.4,
			colors: ["#bee6f6", "#ffe67b", "#3a3a3a"],
		},
		PHO: {
			region: "Phoenix",
			name: "Vultures",
			abbrev: "PHO",
			pop: 3.6,
			colors: ["#d17d2a", "#231f20", "#c09867"],
		},
		PIT: {
			region: "Pittsburgh",
			name: "Rivers",
			abbrev: "PIT",
			pop: 1.7,
			colors: ["#fbee28", "#231f20", "#ffffff"],
		},
		POR: {
			region: "Portland",
			name: "Roses",
			abbrev: "POR",
			pop: 1.8,
			colors: ["#e41d34", "#1e1e1e", "#e7a9cc"],
		},
		SA: {
			region: "San Antonio",
			name: "Churros",
			abbrev: "SA",
			pop: 1.8,
			colors: ["#4a2b14", "#30d9ff", "#704723"],
		},
		SAC: {
			region: "Sacramento",
			name: "Gold Rush",
			abbrev: "SAC",
			pop: 1.7,
			colors: ["#e4c649", "#735823", "#f8e19f"],
		},
		SD: {
			region: "San Diego",
			name: "Pandas",
			abbrev: "SD",
			pop: 3.0,
			colors: ["#231f20", "#ffffff", "#b2b3b3"],
		},
		SEA: {
			region: "Seattle",
			name: "Symphony",
			abbrev: "SEA",
			pop: 3.1,
			colors: ["#47ff47", "#000000", "#8f8f8f"],
		},
		SF: {
			region: "San Francisco",
			name: "Venture Capitalists",
			abbrev: "SF",
			pop: 3.3,
			colors: ["#0e442e", "#d75f27", "#e7d3ae"],
		},
		STL: {
			region: "St. Louis",
			name: "Spirits",
			abbrev: "STL",
			pop: 2.2,
			colors: ["#c0c1c2", "#133cd1", "#3a3a3a"],
		},
		TOR: {
			region: "Toronto",
			name: "Beavers",
			abbrev: "TOR",
			pop: 6.3,
			colors: ["#832525", "#5e372c", "#331b16"],
		},
		TPA: {
			region: "Tampa",
			name: "Turtles",
			abbrev: "TPA",
			pop: 2.4,
			colors: ["#eb851e", "#17cc21", "#023a02"],
		},
		UTA: {
			region: "Utah",
			name: "???",
			abbrev: "UTA",
			pop: 1.2,
			colors: ["#000000", "#cccccc", "#ffffff"],
		},
		VAN: {
			region: "Vancouver",
			name: "Whalers",
			abbrev: "VAN",
			pop: 2.3,
			colors: ["#1ea194", "#213063", "#117568"],
		},
		WAS: {
			region: "Washington",
			name: "Monuments",
			abbrev: "WAS",
			pop: 4.6,
			colors: ["#213063", "#c5ae6e", "#ffffff"],
		},
	};

	let teams: Omit<TeamBasic, "popRank">[];
	if (process.env.SPORT === "basketball") {
		if (realistic) {
			teams = [
				{
					tid: 0,
					cid: 0,
					did: 2,
					imgURL: undefined,
					...teamInfos.ATL,
				},
				{
					tid: 1,
					cid: 0,
					did: 0,
					imgURL: undefined,
					...teamInfos.BOS,
				},
				{
					tid: 2,
					cid: 0,
					did: 0,
					imgURL: undefined,
					...teamInfos.BKN,
				},
				{
					tid: 3,
					cid: 0,
					did: 2,
					imgURL: undefined,
					...teamInfos.CHA,
				},
				{
					tid: 4,
					cid: 0,
					did: 1,
					imgURL: undefined,
					...teamInfos.CHI,
				},
				{
					tid: 5,
					cid: 0,
					did: 1,
					imgURL: undefined,
					...teamInfos.CLE,
				},
				{
					tid: 6,
					cid: 1,
					did: 3,
					imgURL: undefined,
					...teamInfos.DAL,
				},
				{
					tid: 7,
					cid: 1,
					did: 4,
					imgURL: undefined,
					...teamInfos.DEN,
				},
				{
					tid: 8,
					cid: 0,
					did: 1,
					imgURL: undefined,
					...teamInfos.DET,
				},
				{
					tid: 9,
					cid: 1,
					did: 5,
					imgURL: undefined,
					...teamInfos.SF,
					abbrev: "GS",
					region: "Golden State",
				},
				{
					tid: 10,
					cid: 1,
					did: 3,
					imgURL: undefined,
					...teamInfos.HOU,
				},
				{
					tid: 11,
					cid: 0,
					did: 1,
					imgURL: undefined,
					...teamInfos.IND,
				},
				{
					tid: 12,
					cid: 1,
					did: 5,
					imgURL: undefined,
					...teamInfos.LA,
				},
				{
					tid: 13,
					cid: 1,
					did: 5,
					imgURL: undefined,
					...teamInfos.LAL,
				},
				{
					tid: 14,
					cid: 1,
					did: 3,
					imgURL: undefined,
					...teamInfos.MEM,
				},
				{
					tid: 15,
					cid: 0,
					did: 2,
					imgURL: undefined,
					...teamInfos.MIA,
				},
				{
					tid: 16,
					cid: 0,
					did: 1,
					imgURL: undefined,
					...teamInfos.MIL,
				},
				{
					tid: 17,
					cid: 1,
					did: 4,
					imgURL: undefined,
					...teamInfos.MIN,
				},
				{
					tid: 18,
					cid: 1,
					did: 3,
					imgURL: undefined,
					...teamInfos.NOL,
				},
				{ tid: 19, cid: 0, did: 0, imgURL: undefined, ...teamInfos.NYC },
				{
					tid: 20,
					cid: 1,
					did: 4,
					imgURL: undefined,
					...teamInfos.OKC,
				},
				{
					tid: 21,
					cid: 0,
					did: 2,
					imgURL: undefined,
					...teamInfos.ORL,
				},
				{
					tid: 22,
					cid: 0,
					did: 0,
					imgURL: undefined,
					...teamInfos.PHI,
				},
				{
					tid: 23,
					cid: 1,
					did: 5,
					imgURL: undefined,
					...teamInfos.PHO,
				},
				{
					tid: 24,
					cid: 1,
					did: 4,
					imgURL: undefined,
					...teamInfos.POR,
				},
				{
					tid: 25,
					cid: 1,
					did: 5,
					imgURL: undefined,
					...teamInfos.SAC,
				},
				{
					tid: 26,
					cid: 1,
					did: 3,
					imgURL: undefined,
					...teamInfos.SA,
				},
				{
					tid: 27,
					cid: 0,
					did: 0,
					imgURL: undefined,
					...teamInfos.TOR,
				},
				{ tid: 28, cid: 1, did: 4, imgURL: undefined, ...teamInfos.UTA },
				{
					tid: 29,
					cid: 0,
					did: 2,
					imgURL: undefined,
					...teamInfos.WAS,
				},
			];
		} else {
			teams = [
				{
					tid: 0,
					cid: 0,
					did: 2,
					imgURL: undefined,
					...teamInfos.ATL,
				},
				{
					tid: 1,
					cid: 0,
					did: 2,
					imgURL: undefined,
					...teamInfos.BAL,
				},
				{
					tid: 2,
					cid: 0,
					did: 0,
					imgURL: undefined,
					...teamInfos.BOS,
				},
				{
					tid: 3,
					cid: 0,
					did: 1,
					imgURL: undefined,
					...teamInfos.CHI,
				},
				{
					tid: 4,
					cid: 0,
					did: 1,
					imgURL: undefined,
					...teamInfos.CIN,
				},
				{
					tid: 5,
					cid: 0,
					did: 1,
					imgURL: undefined,
					...teamInfos.CLE,
				},
				{
					tid: 6,
					cid: 1,
					did: 3,
					imgURL: undefined,
					...teamInfos.DAL,
				},
				{
					tid: 7,
					cid: 1,
					did: 4,
					imgURL: undefined,
					...teamInfos.DEN,
				},
				{
					tid: 8,
					cid: 0,
					did: 1,
					imgURL: undefined,
					...teamInfos.DET,
				},
				{
					tid: 9,
					cid: 1,
					did: 3,
					imgURL: undefined,
					...teamInfos.HOU,
				},
				{
					tid: 10,
					cid: 1,
					did: 5,
					imgURL: undefined,
					...teamInfos.LV,
				},
				{
					tid: 11,
					cid: 1,
					did: 5,
					imgURL: undefined,
					...teamInfos.LA,
				},
				{
					tid: 12,
					cid: 1,
					did: 3,
					imgURL: undefined,
					...teamInfos.MXC,
				},
				{
					tid: 13,
					cid: 0,
					did: 2,
					imgURL: undefined,
					...teamInfos.MIA,
				},
				{
					tid: 14,
					cid: 1,
					did: 4,
					imgURL: undefined,
					...teamInfos.MIN,
				},
				{
					tid: 15,
					cid: 0,
					did: 0,
					imgURL: undefined,
					...teamInfos.MON,
				},
				{
					tid: 16,
					cid: 0,
					did: 0,
					imgURL: undefined,
					...teamInfos.NYC,
				},
				{
					tid: 17,
					cid: 0,
					did: 0,
					imgURL: undefined,
					...teamInfos.PHI,
				},
				{
					tid: 18,
					cid: 1,
					did: 3,
					imgURL: undefined,
					...teamInfos.PHO,
				},
				{
					tid: 19,
					cid: 0,
					did: 1,
					imgURL: undefined,
					...teamInfos.PIT,
				},
				{
					tid: 20,
					cid: 1,
					did: 4,
					imgURL: undefined,
					...teamInfos.POR,
				},
				{
					tid: 21,
					cid: 1,
					did: 5,
					imgURL: undefined,
					...teamInfos.SAC,
				},
				{
					tid: 22,
					cid: 1,
					did: 5,
					imgURL: undefined,
					...teamInfos.SD,
				},
				{
					tid: 23,
					cid: 1,
					did: 5,
					imgURL: undefined,
					...teamInfos.SF,
				},
				{
					tid: 24,
					cid: 1,
					did: 4,
					imgURL: undefined,
					...teamInfos.SEA,
				},
				{
					tid: 25,
					cid: 1,
					did: 3,
					imgURL: undefined,
					...teamInfos.STL,
				},
				{
					tid: 26,
					cid: 0,
					did: 2,
					imgURL: undefined,
					...teamInfos.TPA,
				},
				{
					tid: 27,
					cid: 0,
					did: 0,
					imgURL: undefined,
					...teamInfos.TOR,
				},
				{
					tid: 28,
					cid: 1,
					did: 4,
					imgURL: undefined,
					...teamInfos.VAN,
				},
				{
					tid: 29,
					cid: 0,
					did: 2,
					imgURL: undefined,
					...teamInfos.WAS,
				},
			];
		}
	} else {
		teams = [
			{
				tid: 0,
				cid: 1,
				did: 6,
				imgURL: undefined,
				...teamInfos.ATL,
			},
			{
				tid: 1,
				cid: 0,
				did: 0,
				imgURL: undefined,
				...teamInfos.BAL,
			},
			{
				tid: 2,
				cid: 0,
				did: 0,
				imgURL: undefined,
				...teamInfos.BOS,
			},
			{
				tid: 3,
				cid: 1,
				did: 5,
				imgURL: undefined,
				...teamInfos.CHI,
			},
			{
				tid: 4,
				cid: 0,
				did: 1,
				imgURL: undefined,
				...teamInfos.CIN,
			},
			{
				tid: 5,
				cid: 0,
				did: 1,
				imgURL: undefined,
				...teamInfos.CLE,
			},
			{
				tid: 6,
				cid: 1,
				did: 4,
				imgURL: undefined,
				...teamInfos.DAL,
			},
			{
				tid: 7,
				cid: 0,
				did: 3,
				imgURL: undefined,
				...teamInfos.DEN,
			},
			{
				tid: 8,
				cid: 1,
				did: 5,
				imgURL: undefined,
				...teamInfos.DET,
			},
			{
				tid: 9,
				cid: 0,
				did: 2,
				imgURL: undefined,
				...teamInfos.HOU,
			},
			{
				tid: 10,
				cid: 0,
				did: 2,
				imgURL: undefined,
				...teamInfos.KC,
			},
			{
				tid: 11,
				cid: 0,
				did: 2,
				imgURL: undefined,
				...teamInfos.LV,
			},
			{
				tid: 12,
				cid: 1,
				did: 7,
				imgURL: undefined,
				...teamInfos.LA,
			},
			{
				tid: 13,
				cid: 1,
				did: 6,
				imgURL: undefined,
				...teamInfos.MXC,
			},
			{
				tid: 14,
				cid: 0,
				did: 0,
				imgURL: undefined,
				...teamInfos.MIA,
			},
			{
				tid: 15,
				cid: 1,
				did: 5,
				imgURL: undefined,
				...teamInfos.MIN,
			},
			{
				tid: 16,
				cid: 0,
				did: 1,
				imgURL: undefined,
				...teamInfos.MON,
			},
			{
				tid: 17,
				cid: 1,
				did: 4,
				imgURL: undefined,
				...teamInfos.NYC,
			},
			{
				tid: 18,
				cid: 1,
				did: 4,
				imgURL: undefined,
				...teamInfos.PHI,
			},
			{
				tid: 19,
				cid: 0,
				did: 2,
				imgURL: undefined,
				...teamInfos.PHO,
			},
			{
				tid: 20,
				cid: 0,
				did: 0,
				imgURL: undefined,
				...teamInfos.PIT,
			},
			{
				tid: 21,
				cid: 0,
				did: 3,
				imgURL: undefined,
				...teamInfos.POR,
			},
			{
				tid: 22,
				cid: 1,
				did: 7,
				imgURL: undefined,
				...teamInfos.SAC,
			},
			{
				tid: 23,
				cid: 1,
				did: 6,
				imgURL: undefined,
				...teamInfos.SA,
			},
			{
				tid: 24,
				cid: 0,
				did: 3,
				imgURL: undefined,
				...teamInfos.SD,
			},
			{
				tid: 25,
				cid: 1,
				did: 7,
				imgURL: undefined,
				...teamInfos.SF,
			},
			{
				tid: 26,
				cid: 1,
				did: 7,
				imgURL: undefined,
				...teamInfos.SEA,
			},
			{
				tid: 27,
				cid: 1,
				did: 5,
				imgURL: undefined,
				...teamInfos.STL,
			},
			{
				tid: 28,
				cid: 1,
				did: 6,
				imgURL: undefined,
				...teamInfos.TPA,
			},
			{
				tid: 29,
				cid: 0,
				did: 1,
				imgURL: undefined,
				...teamInfos.TOR,
			},
			{
				tid: 30,
				cid: 0,
				did: 3,
				imgURL: undefined,
				...teamInfos.VAN,
			},
			{
				tid: 31,
				cid: 1,
				did: 4,
				imgURL: undefined,
				...teamInfos.WAS,
			},
		];
	}

	for (const t of teams) {
		t.imgURL = `/img/logos/${t.abbrev}.png`;
	}

	const popRanks = getPopRanks(teams);

	return teams.map((t, i) => ({
		...t,
		popRank: popRanks[i],
	}));
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
	if (amount < 0) {
		return `-$${Math.abs(amount).toFixed(precision)}${append}`;
	}

	if (append === "M" && amount > 1000) {
		amount /= 1000;
		append = "B";
	}

	return `$${amount.toFixed(precision)}${append}`;
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

/**
 * Will a player negotiate with a team, or not?
 *
 * @param {number} amount Player's desired contract amount, already adjusted for mood as in amountWithMood, in thousands of dollars
 * @param {number} mood Player's mood towards the team in question.
 * @return {boolean} Answer to the question.
 */
const refuseToNegotiate = (
	amount: number,
	mood: number,
	playersRefuseToNegotiate: boolean,
	rookie: boolean = false,
): boolean => {
	if (!playersRefuseToNegotiate) {
		return false;
	}

	if (rookie) {
		return false;
	}

	if (process.env.SPORT === "football") {
		return amount * mood > 11000;
	}

	return amount * mood > 9500;
};

const upperCaseFirstLetter = (string: string): string => {
	return `${string.charAt(0).toUpperCase()}${string.slice(1)}`;
};

// https://medium.com/@_achou/dont-give-up-and-use-suppressimplicitanyindexerrors-ca6b208b9365
const keys = <O extends object>(obj: O): Array<keyof O> => {
	return Object.keys(obj) as Array<keyof O>;
};

export default {
	addPopRank,
	getPopRanks,
	gameScore,
	getTeamsDefault,
	deepCopy,
	formatCurrency,
	bound,
	leagueUrlFactory,
	numberWithCommas,
	ordinal,
	yearRanges,
	roundWinp,
	refuseToNegotiate,
	upperCaseFirstLetter,
	keys,
};
