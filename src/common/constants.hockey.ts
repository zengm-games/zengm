import type { CompositeWeights, Conf, Div } from "./types";
import type { RatingKey } from "./types.hockey";

const COMPOSITE_WEIGHTS: CompositeWeights<RatingKey> = {
	pace: {
		ratings: ["spd", "pss"],
	},
	playmaker: {
		ratings: ["stk", "pss", "oiq", "spd", "hgt", "stre"],
		weights: [1, 1, 1, 1, 0.25, 0.1],
		skill: {
			label: "Pm",
			cutoff: 0.65,
		},
	},
	power: {
		ratings: ["stk", "stre", "chk", "hgt", "spd"],
		weights: [1, 1, 1, 0.25, 0.1],
		skill: {
			label: "Pw",
			cutoff: 0.65,
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
			cutoff: 0.65,
		},
	},
	sniper: {
		ratings: ["sst", "wst", "oiq"],
		weights: [1, 1, 0.25],
		skill: {
			label: "S",
			cutoff: 0.65,
		},
	},
	faceoffs: {
		ratings: ["fcf"],
	},
	goalkeeping: {
		ratings: ["glk"],
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
		name: "Stats",
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
};

const POSITIONS = ["C", "W", "D", "G"];

const POSITION_COUNTS = {
	C: 4,
	W: 8,
	D: 6,
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

const DEFAULT_STADIUM_CAPACITY = 17500;

export {
	AWARD_NAMES,
	DEFAULT_CONFS,
	DEFAULT_DIVS,
	COMPOSITE_WEIGHTS,
	PLAYER_STATS_TABLES,
	PLAYER_SUMMARY,
	POSITION_COUNTS,
	POSITIONS,
	RATINGS,
	SIMPLE_AWARDS,
	TEAM_STATS_TABLES,
	DEFAULT_STADIUM_CAPACITY,
};
