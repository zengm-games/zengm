import * as constantsBasketball from "./constants.basketball";
import * as constantsFootball from "./constants.football";

import type { CompositeWeights, Phase, DraftType, MoodTrait } from "./types";

const ACCOUNT_API_URL =
	process.env.NODE_ENV === "development"
		? "http://account.basketball-gm.test"
		: `https://account.${process.env.SPORT}-gm.com`;

const DIFFICULTY = {
	Easy: -0.25,
	Normal: 0,
	Hard: 0.25,
	Insane: 1,
};

const MAX_SUPPORTED_LEAGUE_VERSION = 40;

const NO_LOTTERY_DRAFT_TYPES: DraftType[] = [
	"freeAgents",
	"noLottery",
	"noLotteryReverse",
	"random",
];

const PHASE: {
	EXPANSION_DRAFT: Phase;
	FANTASY_DRAFT: Phase;
	PRESEASON: Phase;
	REGULAR_SEASON: Phase;
	AFTER_TRADE_DEADLINE: Phase;
	PLAYOFFS: Phase;
	DRAFT_LOTTERY: Phase;
	DRAFT: Phase;
	AFTER_DRAFT: Phase;
	RESIGN_PLAYERS: Phase;
	FREE_AGENCY: Phase;
} = {
	EXPANSION_DRAFT: -2,
	FANTASY_DRAFT: -1,
	PRESEASON: 0,
	REGULAR_SEASON: 1,
	AFTER_TRADE_DEADLINE: 2,
	PLAYOFFS: 3,
	DRAFT_LOTTERY: 4,
	DRAFT: 5,
	AFTER_DRAFT: 6,
	RESIGN_PLAYERS: 7,
	FREE_AGENCY: 8,
};

const PLAYER = {
	FREE_AGENT: -1,
	UNDRAFTED: -2,
	RETIRED: -3,
	UNDRAFTED_FANTASY_TEMP: -6, // Store current draft class here during fantasy draft

	// THESE ARE OBSOLETE!
	UNDRAFTED_2: -4, // Next year's draft class
	UNDRAFTED_3: -5, // Next next year's draft class
};

const PHASE_TEXT = {
	"-2": "expansion draft",
	"-1": "fantasy draft",
	"0": "preseason",
	"1": "regular season",
	"2": "regular season",
	"3": "playoffs",
	"4": process.env.SPORT === "basketball" ? "draft lottery" : "before draft", // Would be better to read from g.get("draftType")
	"5": "draft",
	"6": "after draft",
	"7": "re-sign players",
	"8": "free agency",
};

const STRIPE_PUBLISHABLE_KEY =
	process.env.NODE_ENV === "development"
		? "pk_test_Qbz0froGmHLp0dPCwHoYFY08"
		: "pk_live_Dmo7Vs6uSaoYHrFngr4lM0sa";

const COMPOSITE_WEIGHTS: CompositeWeights =
	process.env.SPORT === "football"
		? constantsFootball.COMPOSITE_WEIGHTS
		: constantsBasketball.COMPOSITE_WEIGHTS;
const PLAYER_SUMMARY: {
	[key: string]: {
		name: string;
		onlyShowIf?: string[];
		stats: string[];
		superCols?: any[];
	};
} =
	process.env.SPORT === "football"
		? constantsFootball.PLAYER_SUMMARY
		: constantsBasketball.PLAYER_SUMMARY;
const PLAYER_STATS_TABLES: {
	[key: string]: {
		name: string;
		onlyShowIf?: string[];
		stats: string[];
		superCols?: any[];
	};
} =
	process.env.SPORT === "football"
		? constantsFootball.PLAYER_STATS_TABLES
		: constantsBasketball.PLAYER_STATS_TABLES;

const RATINGS: any[] =
	process.env.SPORT === "football"
		? constantsFootball.RATINGS
		: constantsBasketball.RATINGS;

const POSITION_COUNTS: {
	[key: string]: number;
} =
	process.env.SPORT === "football"
		? constantsFootball.POSITION_COUNTS
		: constantsBasketball.POSITION_COUNTS;

const POSITIONS: any[] =
	process.env.SPORT === "football"
		? constantsFootball.POSITIONS
		: constantsBasketball.POSITIONS;

const TEAM_STATS_TABLES: {
	[key: string]: {
		name: string;
		stats: string[];
		superCols?: any[];
	};
} =
	process.env.SPORT === "football"
		? constantsFootball.TEAM_STATS_TABLES
		: constantsBasketball.TEAM_STATS_TABLES;

const TIME_BETWEEN_GAMES: string =
	process.env.SPORT === "football"
		? constantsFootball.TIME_BETWEEN_GAMES
		: constantsBasketball.TIME_BETWEEN_GAMES;

const MOOD_TRAITS: Record<MoodTrait, string> = {
	F: "Fame",
	L: "Loyalty",
	$: "Money",
	W: "Winning",
};

const SIMPLE_AWARDS: Readonly<string[]> =
	process.env.SPORT == "basketball"
		? constantsBasketball.SIMPLE_AWARDS
		: constantsFootball.SIMPLE_AWARDS;

const AWARD_NAMES: Record<string, string> =
	process.env.SPORT == "basketball"
		? constantsBasketball.AWARD_NAMES
		: constantsFootball.AWARDS_NAMES;

// For subscribers who have not renewed yet, give them a 3 day grace period before showing ads again, because sometimes it takes a little extra tim for the payment to process
const GRACE_PERIOD = 60 * 60 * 24 * 3;

export {
	AWARD_NAMES,
	ACCOUNT_API_URL,
	DIFFICULTY,
	GRACE_PERIOD,
	MAX_SUPPORTED_LEAGUE_VERSION,
	MOOD_TRAITS,
	NO_LOTTERY_DRAFT_TYPES,
	PHASE,
	PLAYER,
	PHASE_TEXT,
	STRIPE_PUBLISHABLE_KEY,
	COMPOSITE_WEIGHTS,
	PLAYER_SUMMARY,
	PLAYER_STATS_TABLES,
	RATINGS,
	SIMPLE_AWARDS,
	POSITION_COUNTS,
	POSITIONS,
	TEAM_STATS_TABLES,
	TIME_BETWEEN_GAMES,
};
