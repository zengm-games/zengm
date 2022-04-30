import type { CompositeWeights, Conf, Div } from "./types";
import type { Position, RatingKey } from "./types.baseball";

const COMPOSITE_WEIGHTS: CompositeWeights<RatingKey> = {
	powerPitcher: {
		ratings: ["ppw"],
		weights: [1],
		skill: {
			label: "Pp",
			cutoff: 0.65,
		},
	},
	finessePitcher: {
		ratings: ["ctl", "mov"],
		weights: [1, 1],
		skill: {
			label: "Pf",
			cutoff: 0.65,
		},
	},
	controlPitcher: {
		ratings: ["ctl"],
		weights: [1],
	},
	pitcher: {
		ratings: ["ppw", "mov", "ctl"],
		weights: [1, 1, 0.5], // ctl is weighted less because it counts for strikes/balls too
	},
	workhorsePitcher: {
		ratings: ["endu"],
		weights: [1],
		skill: {
			label: "Pw",
			cutoff: 0.65,
		},
	},
	outfieldRange: {
		ratings: ["spd", "fly", "hgt"],
		weights: [1, 0.2, 0.1],
		skill: {
			label: "Ro",
			cutoff: 0.65,
		},
	},
	infieldRange: {
		ratings: ["spd", "gnd", "hgt"],
		weights: [1, 0.2, 0.2],
		skill: {
			label: "Ri",
			cutoff: 0.65,
		},
	},
	firstBaseDefense: {
		ratings: ["hgt", "gnd"],
		weights: [2, 1],
		skill: {
			label: "D1",
			cutoff: 0.65,
		},
	},
	catcherDefense: {
		ratings: ["cat"],
		weights: [1],
		skill: {
			label: "Dc",
			cutoff: 0.65,
		},
	},
	groundBallDefense: {
		ratings: ["gnd", "spd"],
		weights: [1, 0.2],
		skill: {
			label: "Dg",
			cutoff: 0.65,
		},
	},
	flyBallDefense: {
		ratings: ["fly", "spd"],
		weights: [1, 0.2],
		skill: {
			label: "Df",
			cutoff: 0.65,
		},
	},
	arm: {
		ratings: ["thr"],
		weights: [1],
		skill: {
			label: "A",
			cutoff: 0.65,
		},
	},
	powerHitter: {
		ratings: ["hpw"],
		weights: [1],
		skill: {
			label: "Hp",
			cutoff: 0.65,
		},
	},
	contactHitter: {
		ratings: ["con"],
		weights: [1],
		skill: {
			label: "Hc",
			cutoff: 0.65,
		},
	},
	eye: {
		ratings: ["eye"],
		weights: [1],
		skill: {
			label: "E",
			cutoff: 0.65,
		},
	},
	speed: {
		ratings: ["spd"],
		weights: [1],
		skill: {
			label: "S",
			cutoff: 0.65,
		},
	},
};

const PLAYER_GAME_STATS = {
	batting: {
		name: "Batting",
		stats: ["ab", "r", "h", "rbi", "hr", "sb", "bb", "so", "pa"],
		seasonStats: ["ba", "obp", "slg", "ops"],
		sortBy: ["pa"],
	},
	pitching: {
		name: "Pitching",
		stats: ["ip", "hPit", "rPit", "er", "bbPit", "soPit", "hrPit", "pc"],
		seasonStats: ["era"],
		sortBy: ["min"],
	},
};

const PLAYER_SUMMARY = {
	summaryBatter: {
		name: "SummaryBatter",
		onlyShowIf: ["C", "1B", "2B", "3B", "SS", "LF", "CF", "RF", "DH"],
		stats: ["ab", "h", "hr", "ba", "r", "rbi", "sb", "obp", "slg", "ops"],
	},
	summaryPitcher: {
		name: "SummaryPitcher",
		onlyShowIf: ["SP", "RP"],
		stats: ["w", "l", "era", "gpPit", "gsPit", "sv", "ip", "soPit", "whip"],
	},
};

const PLAYER_STATS_TABLES = {
	batting: {
		name: "Batting",
		stats: [
			"gp",
			"gs",
			"pa",
			"ab",
			"r",
			"h",
			"2b",
			"3b",
			"hr",
			"rbi",
			"sb",
			"cs",
			"bb",
			"so",
			"ba",
			"obp",
			"slg",
			"ops",
			"tb",
			"gdp",
			"hbp",
			"sh",
			"sf",
			"ibb",
		],
		onlyShowIf: ["pa", "r", "sb", "cs"],
	},
	pitching: {
		name: "Pitching",
		stats: [
			"w",
			"l",
			"winp",
			"era",
			"gpPit",
			"gsPit",
			"gf",
			"cg",
			"sho",
			"sv",
			"ip",
			"rPit",
			"er",
			"hPit",
			"2bPit",
			"3bPit",
			"hrPit",
			"bbPit",
			"soPit",
			"pc",
			"ibbPit",
			"hbpPit",
			"shPit",
			"sfPit",
			"bk",
			"wp",
			"bf",
			"fip",
			"whip",
			"h9",
			"hr9",
			"bb9",
			"so9",
			"pc9",
			"sow",
		],
		onlyShowIf: ["gpPit"],
	},
	fielding: {
		name: "Fielding",
		stats: [
			"pos",
			"gpF",
			"gsF",
			"cgF",
			"inn",
			"ch",
			"po",
			"a",
			"e",
			"dp",
			"fldp",
			"rfld",
			"rf9",
			"rfg",
			"pb",
			"sbF",
			"csF",
			"csp",
		],
		onlyShowIf: ["gpF"],
	},
	advanced: {
		name: "Advanced",
		stats: ["rbat", "rbr", "rfldTot", "rpos", "rpit", "war"],
	},
	gameHighs: {
		name: "Game Highs",
		stats: [
			"gp",

			// Batting
			"paMax",
			"abMax",
			"rMax",
			"hMax",
			"2bMax",
			"3bMax",
			"hrMax",
			"rbiMax",
			"sbMax",
			"csMax",
			"bbMax",
			"soMax",
			"gdpMax",
			"tbMax",
			"hbpMax",
			"shMax",
			"sfMax",
			"ibbMax",

			// Pitching
			"ipMax",
			"rPitMax",
			"erMax",
			"hPitMax",
			"2bPitMax",
			"3bPitMax",
			"hrPitMax",
			"bbPitMax",
			"soPitMax",
			"ibbPitMax",
			"hbpPitMax",
			"shPitMax",
			"sfPitMax",
			"bkMax",
			"wpMax",
			"bfMax",
		],
	},
};

const TEAM_STATS_TABLES = {};

const POSITIONS: Position[] = [
	"SP",
	"RP",
	"C",
	"1B",
	"2B",
	"3B",
	"SS",
	"LF",
	"CF",
	"RF",
	"DH",
];

const POS_NUMBERS = {
	P: 1,
	C: 2,
	"1B": 3,
	"2B": 4,
	"3B": 5,
	SS: 6,
	LF: 7,
	CF: 8,
	RF: 9,
	DH: 10,
} as const;

const POS_NUMBERS_INVERSE = {
	1: "P",
	2: "C",
	3: "1B",
	4: "2B",
	5: "3B",
	6: "SS",
	7: "LF",
	8: "CF",
	9: "RF",
	10: "DH",
} as const;

const POSITION_COUNTS: Record<Position, number> = {
	SP: 5,
	RP: 7,
	C: 2,
	"1B": 1.25,
	"2B": 1.25,
	"3B": 1.25,
	SS: 1.25,
	LF: 5 / 3,
	CF: 5 / 3,
	RF: 5 / 3,
	DH: 0,
};

const RATINGS: RatingKey[] = [
	"hgt",
	"spd",
	"hpw",
	"con",
	"eye",
	"gnd",
	"fly",
	"thr",
	"cat",
	"ppw",
	"ctl",
	"mov",
	"endu",
];

const SIMPLE_AWARDS = ["mvp", "roy", "poy", "finalsMvp"] as const;

const AWARD_NAMES = {
	mvp: "Most Valuable Player",
	roy: "Rookie of the Year",
	poy: "Pitcher of the Year",
	finalsMvp: "Finals MVP",
	allOffense: "All-Offense Team",
	allDefense: "All-Defense Team",
} as const;

const DEFAULT_CONFS: Conf[] = [
	{
		cid: 0,
		name: "American Conference",
	},
	{
		cid: 1,
		name: "National Conference",
	},
];

const DEFAULT_DIVS: Div[] = [
	{
		did: 0,
		cid: 0,
		name: "East",
	},
	{
		did: 1,
		cid: 0,
		name: "Central",
	},
	{
		did: 2,
		cid: 0,
		name: "West",
	},
	{
		did: 3,
		cid: 1,
		name: "East",
	},
	{
		did: 4,
		cid: 1,
		name: "Central",
	},
	{
		did: 5,
		cid: 1,
		name: "West",
	},
];

const DEFAULT_STADIUM_CAPACITY = 50000;

export {
	AWARD_NAMES,
	DEFAULT_CONFS,
	DEFAULT_DIVS,
	COMPOSITE_WEIGHTS,
	PLAYER_GAME_STATS,
	PLAYER_STATS_TABLES,
	PLAYER_SUMMARY,
	POS_NUMBERS,
	POS_NUMBERS_INVERSE,
	POSITION_COUNTS,
	POSITIONS,
	RATINGS,
	SIMPLE_AWARDS,
	TEAM_STATS_TABLES,
	DEFAULT_STADIUM_CAPACITY,
};
