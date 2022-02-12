import type { CompositeWeights, Conf, Div } from "./types";
import type { RatingKey } from "./types.basketball";

const COMPOSITE_WEIGHTS: CompositeWeights<RatingKey> = {
	pace: {
		ratings: ["jmp", "dnk", "diq", "drb", "oiq"],
	},
	usage: {
		ratings: ["ins", "fg", "dnk", "oiq", "drb", "jmp"],
		weights: [1.0, 0.88, 0.5, 0.13, 0.1, 0.1],
		skill: {
			label: "V",
			cutoff: 0.61,
		},
	},
	dribbling: {
		ratings: ["drb", "spd"],
		weights: [1, 1],
		skill: {
			label: "B",
			cutoff: 0.68,
		},
	},
	passing: {
		ratings: ["drb", "pss", "oiq"],
		weights: [0.25, 1, 0.2],
		skill: {
			label: "Ps",
			cutoff: 0.63,
		},
	},
	turnovers: {
		ratings: [50, "ins", "pss", "oiq"],
		weights: [2, 1, 0.75, -1],
	},
	shootingAtRim: {
		ratings: ["hgt", "stre", "dnk", "oiq"],
		weights: [2, 0.3, 0.3, 0.2],
	},
	shootingLowPost: {
		ratings: ["hgt", "stre", "spd", "ins", "oiq"],
		weights: [1, 0.6, 0.2, 1, 0.4],
		skill: {
			label: "Po",
			cutoff: 0.61,
		},
	},
	shootingMidRange: {
		ratings: ["oiq", "fg", "stre"],
		weights: [-0.5, 1, 0.2],
	},
	shootingThreePointer: {
		ratings: ["oiq", "tp"],
		weights: [0.1, 1],
		skill: {
			label: "3",
			cutoff: 0.59,
		},
	},
	shootingFT: {
		ratings: ["ft"],
	},
	rebounding: {
		ratings: ["hgt", "reb", "diq"],
		weights: [1, 1, 0.1],
		skill: {
			label: "R",
			cutoff: 0.61,
		},
	},
	stealing: {
		ratings: ["spd", "diq"],
		weights: [0.5, 1.0],
	},
	blocking: {
		ratings: ["hgt", "jmp", "diq"],
		weights: [1.0, 0.4, 0.1],
	},
	fouling: {
		ratings: [50, "hgt", "diq", "spd"],
		weights: [3, 1, -1, -1],
	},
	drawingFouls: {
		ratings: ["hgt", "spd", "dnk", "pss", "reb"],
		weights: [1, 0.6, 0.8, 0.4, 0.6],
	},
	defense: {
		ratings: ["hgt", "stre", "spd", "jmp", "diq"],
		weights: [1, 1, 1, 0.5, 2],
	},
	defenseInterior: {
		ratings: ["hgt", "stre", "spd", "jmp", "diq"],
		weights: [2.5, 1, 0.5, 0.5, 2],
		skill: {
			label: "Di",
			cutoff: 0.57,
		},
	},
	defensePerimeter: {
		ratings: ["hgt", "stre", "spd", "jmp", "diq"],
		weights: [0.5, 0.5, 2, 0.5, 1],
		skill: {
			label: "Dp",
			cutoff: 0.61,
		},
	},
	endurance: {
		ratings: [50, "endu"],
		weights: [1, 1],
	},
	athleticism: {
		ratings: ["stre", "spd", "jmp", "hgt"],
		weights: [1, 1, 1, 0.75],
		skill: {
			label: "A",
			cutoff: 0.63,
		},
	},
	jumpBall: {
		ratings: ["hgt", "jmp"],
		weights: [1, 0.25],
	},
};

const PLAYER_GAME_STATS = {
	all: {
		name: "All",
		stats: [
			"gs",
			"min",
			"fg",
			"fga",
			"fgp",
			"tp",
			"tpa",
			"tpp",
			"ft",
			"fta",
			"ftp",
			"orb",
			"drb",
			"trb",
			"ast",
			"tov",
			"stl",
			"blk",
			"ba",
			"pf",
			"pts",
			"pm",
			"gmsc",
		],
		sortBy: ["min"],
	},
};

const PLAYER_SUMMARY = {
	summary: {
		name: "Summary",
		stats: ["gp", "pts", "trb", "ast", "fgp", "tpp", "ftp", "tsp", "per", "ws"],
	},
};

const PLAYER_STATS_TABLES = {
	regular: {
		name: "Per Game",
		stats: [
			"gp",
			"gs",
			"min",
			"fg",
			"fga",
			"fgp",
			"tp",
			"tpa",
			"tpp",
			"2p",
			"2pa",
			"2pp",
			"efg",
			"ft",
			"fta",
			"ftp",
			"orb",
			"drb",
			"trb",
			"ast",
			"tov",
			"stl",
			"blk",
			"ba",
			"pf",
			"pts",
		],
	},
	shotLocations: {
		name: "Shot Locations and Feats",
		stats: [
			"gp",
			"gs",
			"min",
			"fgAtRim",
			"fgaAtRim",
			"fgpAtRim",
			"fgLowPost",
			"fgaLowPost",
			"fgpLowPost",
			"fgMidRange",
			"fgaMidRange",
			"fgpMidRange",
			"tp",
			"tpa",
			"tpp",
			"dd",
			"td",
			"qd",
			"fxf",
		],
		superCols: [
			{
				title: "",
				colspan: 7,
			},
			{
				title: "At Rim",
				colspan: 3,
			},
			{
				title: "Low Post",
				colspan: 3,
			},
			{
				title: "Mid-Range",
				colspan: 3,
			},
			{
				title: "3PT",
				desc: "Three-Pointers",
				colspan: 3,
			},
			{
				title: "Feats",
				desc: "Statistical Feats",
				colspan: 4,
			},
		],
	},
	advanced: {
		name: "Advanced",
		stats: [
			"gp",
			"gs",
			"min",
			"per",
			"ewa",
			"tsp",
			"tpar",
			"ftr",
			"orbp",
			"drbp",
			"trbp",
			"astp",
			"stlp",
			"blkp",
			"tovp",
			"usgp",
			"pm",
			"ortg",
			"drtg",
			"ows",
			"dws",
			"ws",
			"ws48",
			"obpm",
			"dbpm",
			"bpm",
			"vorp",
		],
	},
	gameHighs: {
		name: "Game Highs",
		stats: [
			"gp",
			"minMax",
			"fgMax",
			"fgaMax",
			"tpMax",
			"tpaMax",
			"2pMax",
			"2paMax",
			"ftMax",
			"ftaMax",
			"orbMax",
			"drbMax",
			"trbMax",
			"astMax",
			"tovMax",
			"stlMax",
			"blkMax",
			"baMax",
			"pfMax",
			"ptsMax",
			"pmMax",
			"gmscMax",
		],
	},
};

const TEAM_STATS_TABLES = {
	team: {
		name: "Team",
		stats: [
			"fg",
			"fga",
			"fgp",
			"tp",
			"tpa",
			"tpp",
			"2p",
			"2pa",
			"2pp",
			"ft",
			"fta",
			"ftp",
			"orb",
			"drb",
			"trb",
			"ast",
			"tov",
			"stl",
			"blk",
			"pf",
			"pts",
			"mov",
		],
	},
	opponent: {
		name: "Opponent",
		stats: [
			"oppFg",
			"oppFga",
			"oppFgp",
			"oppTp",
			"oppTpa",
			"oppTpp",
			"opp2p",
			"opp2pa",
			"opp2pp",
			"oppFt",
			"oppFta",
			"oppFtp",
			"oppOrb",
			"oppDrb",
			"oppTrb",
			"oppAst",
			"oppTov",
			"oppStl",
			"oppBlk",
			"oppPf",
			"oppPts",
			"oppMov",
		],
	},
	teamShotLocations: {
		name: "Shot Locations and Feats",
		stats: [
			"fgAtRim",
			"fgaAtRim",
			"fgpAtRim",
			"fgLowPost",
			"fgaLowPost",
			"fgpLowPost",
			"fgMidRange",
			"fgaMidRange",
			"fgpMidRange",
			"tp",
			"tpa",
			"tpp",
			"dd",
			"td",
			"qd",
			"fxf",
		],
		superCols: [
			{
				title: "",
				colspan: 4,
			},
			{
				title: "At Rim",
				colspan: 3,
			},
			{
				title: "Low Post",
				colspan: 3,
			},
			{
				title: "Mid-Range",
				colspan: 3,
			},
			{
				title: "3PT",
				desc: "Three-Pointers",
				colspan: 3,
			},
			{
				title: "Feats",
				desc: "Statistical Feats",
				colspan: 4,
			},
		],
	},
	opponentShotLocations: {
		name: "Opponent Shot Locations and Feats",
		stats: [
			"oppFgAtRim",
			"oppFgaAtRim",
			"oppFgpAtRim",
			"oppFgLowPost",
			"oppFgaLowPost",
			"oppFgpLowPost",
			"oppFgMidRange",
			"oppFgaMidRange",
			"oppFgpMidRange",
			"oppTp",
			"oppTpa",
			"oppTpp",
			"oppDd",
			"oppTd",
			"oppQd",
			"oppFxf",
		],
		superCols: [
			{
				title: "",
				colspan: 4,
			},
			{
				title: "At Rim",
				colspan: 3,
			},
			{
				title: "Low Post",
				colspan: 3,
			},
			{
				title: "Mid-Range",
				colspan: 3,
			},
			{
				title: "3PT",
				desc: "Three-Pointers",
				colspan: 3,
			},
			{
				title: "Feats",
				desc: "Statistical Feats",
				colspan: 4,
			},
		],
	},
	advanced: {
		name: "Advanced",
		stats: [
			"pw",
			"pl",
			"ortg",
			"drtg",
			"nrtg",
			"pace",
			"tpar",
			"ftr",
			"tsp",
			"efg",
			"tovp",
			"orbp",
			"ftpFga",
		],
	},
};

const POSITIONS = ["PG", "G", "SG", "GF", "SF", "F", "PF", "FC", "C"];

const POSITION_COUNTS = {};

const RATINGS: RatingKey[] = [
	"hgt",
	"stre",
	"spd",
	"jmp",
	"endu",
	"ins",
	"dnk",
	"ft",
	"fg",
	"tp",
	"oiq",
	"diq",
	"drb",
	"pss",
	"reb",
];

const SIMPLE_AWARDS = [
	"mvp",
	"roy",
	"smoy",
	"dpoy",
	"mip",
	"finalsMvp",
] as const;

const AWARD_NAMES = {
	mvp: "Most Valuable Player",
	roy: "Rookie of the Year",
	smoy: "Sixth Man of the Year",
	dpoy: "Defensive Player of the Year",
	mip: "Most Improved Player",
	finalsMvp: "Finals MVP",
	allLeague: "All-League",
	allDefensive: "All-Defensive",
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
		name: "Central",
	},
	{
		did: 2,
		cid: 0,
		name: "Southeast",
	},
	{
		did: 3,
		cid: 1,
		name: "Southwest",
	},
	{
		did: 4,
		cid: 1,
		name: "Northwest",
	},
	{
		did: 5,
		cid: 1,
		name: "Pacific",
	},
];

const DEFAULT_STADIUM_CAPACITY = 25000;

export {
	AWARD_NAMES,
	DEFAULT_CONFS,
	DEFAULT_DIVS,
	COMPOSITE_WEIGHTS,
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
