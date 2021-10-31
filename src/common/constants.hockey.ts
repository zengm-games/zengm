import type { CompositeWeights, Conf, Div } from "./types";
import type { Position, RatingKey } from "./types.hockey";

const COMPOSITE_WEIGHTS: CompositeWeights<RatingKey> = {
	playmaker: {
		ratings: ["stk", "pss", "oiq", "spd", "hgt", "stre"],
		weights: [1, 1, 1, 1, 0.25, 0.1],
		skill: {
			label: "Pm",
			cutoff: 0.57,
		},
	},
	power: {
		ratings: ["stk", "stre", "chk", "hgt", "spd"],
		weights: [1, 1, 1, 0.25, 0.1],
		skill: {
			label: "Pw",
			cutoff: 0.47,
		},
	},
	grinder: {
		ratings: ["blk", "chk", "diq", "hgt", "stre", "spd"],
		weights: [1, 1, 1, 0.25, 0.25, 0.1],
		skill: {
			label: "G",
			cutoff: 0.65,
		},
	},
	enforcer: {
		ratings: ["stre", "chk", "hgt", "spd"],
		weights: [1, 1, 0.25, 0.1],
		skill: {
			label: "E",
			cutoff: 0.61,
		},
	},
	sniper: {
		ratings: ["sst", "wst", "oiq"],
		weights: [1, 1, 0.25],
		skill: {
			label: "S",
			cutoff: 0.68,
		},
	},
	faceoffs: {
		ratings: ["fcf"],
	},
	goalkeeping: {
		ratings: ["glk"],
	},
	blocking: {
		ratings: ["blk", "diq", "stre", "spd"],
		weights: [1, 1, 0.1, 0.1],
	},
	scoring: {
		ratings: ["sst", "wst", "stk", "oiq", "spd", "hgt", "stre"],
		weights: [1, 1, 0.5, 1, 1, 0.25, 0.1],
	},
	penalties: {
		ratings: [50, "chk", "diq"],
		weights: [1, 1, -0.5],
	},
	endurance: {
		ratings: [50, "endu"],
		weights: [1, 1],
	},
};

const PLAYER_GAME_STATS = {
	skaters: {
		name: "Skater",
		stats: [
			"g",
			"a",
			"pts",
			"pm",
			"pim",
			"s",
			"sPct",
			"hit",
			"blk",
			"gv",
			"tk",
			"fow",
			"fol",
			"foPct",
			"min",
			"ppMin",
			"shMin",
		],
		sortBy: ["min"],
	},
	goalies: {
		name: "Goalie",
		stats: ["ga", "sa", "sv", "svPct", "pim", "min", "ppMin", "shMin"],
		sortBy: ["min"],
	},
};

const PLAYER_SUMMARY = {
	summarySkater: {
		name: "SummarySkater",
		onlyShowIf: ["C", "W", "D"],
		stats: ["gpSkater", "g", "a", "pts", "pm", "ops", "dps", "ps"],
	},
	summaryGoalie: {
		name: "SummaryGoalie",
		onlyShowIf: ["G"],
		stats: ["gpGoalie", "gRec", "so", "gaa", "svPct", "gps"],
	},
};

const PLAYER_STATS_TABLES = {
	goalie: {
		name: "Goalie",
		stats: [
			"gpGoalie",
			"gRec",
			"ga",
			"sa",
			"sv",
			"svPct",
			"gaa",
			"so",
			"min",
			"ppMin",
			"shMin",
			"pim",
		],
		onlyShowIf: ["sv"],
	},
	skater: {
		name: "Skater",
		stats: [
			"gpSkater",
			"g",
			"a",
			"pts",
			"pm",
			"pim",
			"evG",
			"ppG",
			"shG",
			"gwG",
			"evA",
			"ppA",
			"shA",
			"gwA",
			"s",
			"sPct",
			"tsa",
			"min",
			"ppMin",
			"shMin",
			"amin",
			"fow",
			"fol",
			"foPct",
			"blk",
			"hit",
			"tk",
			"gv",
		],
		onlyShowIf: ["pts", "tsa", "fow", "fol", "blk", "hit", "tk", "gv"],
	},
	advanced: {
		name: "Advanced",
		stats: ["gp", "gc", "ops", "dps", "gps", "ps"],
	},
	gameHighs: {
		name: "Game Highs",
		stats: [
			"gp",
			"gMax",
			"aMax",
			"pmMax",
			"pimMax",
			"evGMax",
			"ppGMax",
			"shGMax",
			"evAMax",
			"ppAMax",
			"shAMax",
			"sMax",
			"tsaMax",
			"minMax",
			"ppMinMax",
			"shMinMax",
			"fowMax",
			"folMax",
			"blkMax",
			"hitMax",
			"tkMax",
			"gvMax",
			"gaMax",
			"svMax",
		],
	},
};

const TEAM_STATS_TABLES = {
	team: {
		name: "Team",
		stats: [
			"g",
			"a",
			"pim",
			"evG",
			"ppG",
			"shG",
			"evA",
			"ppA",
			"shA",
			"s",
			"sPct",
			"tsa",
			"ppo",
			"ppPct",
			"fow",
			"fol",
			"foPct",
			"blk",
			"hit",
			"tk",
			"gv",
			"sv",
			"svPct",
			"gaa",
			"so",
			"mov",
		],
	},
	opponent: {
		name: "Opponent",
		stats: [
			"oppG",
			"oppA",
			"oppPim",
			"oppEvG",
			"oppPpG",
			"oppShG",
			"oppEvA",
			"oppPpA",
			"oppShA",
			"oppS",
			"oppSPct",
			"oppTsa",
			"oppPpo",
			"oppPpPct",
			"oppFow",
			"oppFol",
			"oppFoPct",
			"oppBlk",
			"oppHit",
			"oppTk",
			"oppGv",
			"oppSv",
			"oppSvPct",
			"oppGaa",
			"oppSo",
			"oppMov",
		],
	},
};

const POSITIONS: Position[] = ["C", "W", "D", "G"];

const POSITION_COUNTS: Record<Position, number> = {
	C: 5,
	W: 10,
	D: 7,
	G: 3,
};

const RATINGS: RatingKey[] = [
	"hgt",
	"stre",
	"spd",
	"endu",
	"pss",
	"wst",
	"sst",
	"stk",
	"oiq",
	"chk",
	"blk",
	"fcf",
	"diq",
	"glk",
];

const SIMPLE_AWARDS = [
	"mvp",
	"dpoy",
	"dfoy",
	"goy",
	"roy",
	"finalsMvp",
] as const;

const AWARD_NAMES = {
	mvp: "Most Valuable Player",
	roy: "Rookie of the Year",
	dpoy: "Defensive Player of the Year",
	dfoy: "Defensive Forward of the Year",
	goy: "Goalie of the Year",
	finalsMvp: "Playoffs MVP",
	allLeague: "All-League",
	allRookie: "All-Rookie Team",
} as const;

const DEFAULT_CONFS: Conf[] = [
	{
		cid: 0,
		name: "Eastern Conference",
	},
	{
		cid: 1,
		name: "Western Conference",
	},
];

const DEFAULT_DIVS: Div[] = [
	{
		did: 0,
		cid: 0,
		name: "Atlantic",
	},
	{
		did: 1,
		cid: 0,
		name: "Metropolitan",
	},
	{
		did: 2,
		cid: 1,
		name: "Central",
	},
	{
		did: 3,
		cid: 1,
		name: "Pacific",
	},
];

const DEFAULT_STADIUM_CAPACITY = 17500;

const NUM_LINES = {
	F: 4,
	D: 3,
	G: 1,
};

const NUM_PLAYERS_PER_LINE = {
	F: 3,
	D: 2,
	G: 1,
};

export {
	AWARD_NAMES,
	DEFAULT_CONFS,
	DEFAULT_DIVS,
	COMPOSITE_WEIGHTS,
	NUM_LINES,
	NUM_PLAYERS_PER_LINE,
	PLAYER_GAME_STATS,
	PLAYER_STATS_TABLES,
	PLAYER_SUMMARY,
	POSITION_COUNTS,
	POSITIONS,
	RATINGS,
	SIMPLE_AWARDS,
	TEAM_STATS_TABLES,
	DEFAULT_STADIUM_CAPACITY,
};
