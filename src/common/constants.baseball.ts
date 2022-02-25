import type { CompositeWeights, Conf, Div } from "./types";
import type { Position, RatingKey } from "./types.baseball";

const COMPOSITE_WEIGHTS: CompositeWeights<RatingKey> = {};

const PLAYER_GAME_STATS = {};

const PLAYER_SUMMARY = {};

const PLAYER_STATS_TABLES = {};

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
];

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
};

const RATINGS: RatingKey[] = [
	"hgt",
	"spd",
	"hpw",
	"con",
	"eye",
	"fld",
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
	finalsMvp: "Playoffs MVP",
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
	POSITION_COUNTS,
	POSITIONS,
	RATINGS,
	SIMPLE_AWARDS,
	TEAM_STATS_TABLES,
	DEFAULT_STADIUM_CAPACITY,
};
