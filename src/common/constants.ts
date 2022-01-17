import bySport from "./bySport";
import * as constantsBasketball from "./constants.basketball";
import * as constantsFootball from "./constants.football";
import * as constantsHockey from "./constants.hockey";

import type { CompositeWeights, Phase, DraftType, MoodTrait } from "./types";

const ACCOUNT_API_URL =
	process.env.NODE_ENV === "development"
		? "http://account.basketball-gm.test"
		: bySport({
				basketball: "https://account.basketball-gm.com",
				football: "https://account.football-gm.com",
				default: "https://account.zengm.com",
		  });

const DIFFICULTY = {
	Easy: -0.25,
	Normal: 0,
	Hard: 0.25,
	Insane: 1,
};

const DRAFT_BY_TEAM_OVR = bySport({
	basketball: false,
	football: true,
	hockey: true,
});

const MAX_SUPPORTED_LEAGUE_VERSION = 51;

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

	// Store current draft class here during fantasy draft
	UNDRAFTED_FANTASY_TEMP: -6,

	// Used for realStats when a team has been contracted
	DOES_NOT_EXIST: -7,

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
	"4": bySport({
		// Would be better to read from g.get("draftType")
		football: "before draft",
		default: "draft lottery",
	}),
	"5": "draft",
	"6": "after draft",
	"7": "re-sign players",
	"8": "free agency",
};

const STRIPE_PUBLISHABLE_KEY =
	process.env.NODE_ENV === "development"
		? "pk_test_Qbz0froGmHLp0dPCwHoYFY08"
		: "pk_live_Dmo7Vs6uSaoYHrFngr4lM0sa";

const COMPOSITE_WEIGHTS = bySport<CompositeWeights>({
	basketball: constantsBasketball.COMPOSITE_WEIGHTS,
	football: constantsFootball.COMPOSITE_WEIGHTS,
	hockey: constantsHockey.COMPOSITE_WEIGHTS,
});

const PLAYER_GAME_STATS = bySport<{
	[key: string]: {
		name: string;
		stats: string[];
		sortBy: string[];
	};
}>({
	basketball: constantsBasketball.PLAYER_GAME_STATS,
	football: constantsFootball.PLAYER_GAME_STATS,
	hockey: constantsHockey.PLAYER_GAME_STATS,
});

const PLAYER_SUMMARY = bySport<{
	[key: string]: {
		name: string;
		onlyShowIf?: string[];
		stats: string[];
		superCols?: any[];
	};
}>({
	basketball: constantsBasketball.PLAYER_SUMMARY,
	football: constantsFootball.PLAYER_SUMMARY,
	hockey: constantsHockey.PLAYER_SUMMARY,
});

const PLAYER_STATS_TABLES = bySport<{
	[key: string]: {
		name: string;
		onlyShowIf?: string[];
		stats: string[];
		superCols?: any[];
	};
}>({
	basketball: constantsBasketball.PLAYER_STATS_TABLES,
	football: constantsFootball.PLAYER_STATS_TABLES,
	hockey: constantsHockey.PLAYER_STATS_TABLES,
});

const RATINGS = bySport<any[]>({
	basketball: constantsBasketball.RATINGS,
	football: constantsFootball.RATINGS,
	hockey: constantsHockey.RATINGS,
});

const POSITION_COUNTS: {
	[key: string]: number;
} = bySport({
	basketball: constantsBasketball.POSITION_COUNTS,
	football: constantsFootball.POSITION_COUNTS,
	hockey: constantsHockey.POSITION_COUNTS,
});

const POSITIONS = bySport<any[]>({
	basketball: constantsBasketball.POSITIONS,
	football: constantsFootball.POSITIONS,
	hockey: constantsHockey.POSITIONS,
});

const TEAM_STATS_TABLES: {
	[key: string]: {
		name: string;
		stats: string[];
		superCols?: any[];
	};
} = bySport({
	basketball: constantsBasketball.TEAM_STATS_TABLES,
	football: constantsFootball.TEAM_STATS_TABLES,
	hockey: constantsHockey.TEAM_STATS_TABLES,
});

const TIME_BETWEEN_GAMES: string = bySport({
	football: "week",
	default: "day",
});

const MOOD_TRAITS: Record<MoodTrait, string> = {
	F: "Fame",
	L: "Loyalty",
	$: "Money",
	W: "Winning",
};

const SIMPLE_AWARDS = bySport<Readonly<string[]>>({
	basketball: constantsBasketball.SIMPLE_AWARDS,
	football: constantsFootball.SIMPLE_AWARDS,
	hockey: constantsHockey.SIMPLE_AWARDS,
});

const AWARD_NAMES = bySport<Record<string, string>>({
	basketball: constantsBasketball.AWARD_NAMES,
	football: constantsFootball.AWARD_NAMES,
	hockey: constantsHockey.AWARD_NAMES,
});

const DEFAULT_CONFS = bySport({
	basketball: constantsBasketball.DEFAULT_CONFS,
	football: constantsFootball.DEFAULT_CONFS,
	hockey: constantsHockey.DEFAULT_CONFS,
});

const DEFAULT_DIVS = bySport({
	basketball: constantsBasketball.DEFAULT_DIVS,
	football: constantsFootball.DEFAULT_DIVS,
	hockey: constantsHockey.DEFAULT_DIVS,
});

const DEFAULT_STADIUM_CAPACITY = bySport({
	basketball: constantsBasketball.DEFAULT_STADIUM_CAPACITY,
	football: constantsFootball.DEFAULT_STADIUM_CAPACITY,
	hockey: constantsHockey.DEFAULT_STADIUM_CAPACITY,
});

const COURT = bySport({
	basketball: "court",
	football: "field",
	hockey: "ice",
});

const EMAIL_ADDRESS = "jeremy@zengm.com";

const GAME_ACRONYM = bySport({
	basketball: "BBGM",
	football: "FBGM",
	hockey: "ZGMH",
});

const GAME_NAME = bySport({
	basketball: "Basketball GM",
	football: "Football GM",
	hockey: "ZenGM Hockey",
});

const SUBREDDIT_NAME = bySport({
	basketball: "BasketballGM",
	football: "Football_GM",
	hockey: "ZenGMHockey",
});

const TWITTER_HANDLE = bySport({
	basketball: "basketball_gm",
	football: "FootballGM_Game",
	hockey: "ZenGMGames",
});

const FACEBOOK_USERNAME = bySport({
	basketball: "basketball.general.manager",
	football: "football.general.manager",
	hockey: "ZenGMGames",
});

const SPORT_HAS_REAL_PLAYERS = bySport({
	basketball: true,
	football: false,
	hockey: false,
});

const SPORT_HAS_LEGENDS = bySport({
	basketball: true,
	football: false,
	hockey: false,
});

const WEBSITE_PLAY = bySport({
	basketball: "play.basketball-gm.com",
	football: "play.football-gm.com",
	hockey: "hockey.zengm.com",
});

const WEBSITE_ROOT = bySport({
	basketball: "basketball-gm.com",
	football: "football-gm.com",
	hockey: "zengm.com/hockey",
});

// For subscribers who have not renewed yet, give them a 3 day grace period before showing ads again, because sometimes it takes a little extra tim for the payment to process
const GRACE_PERIOD = 60 * 60 * 24 * 3;

const TIEBREAKERS = {
	commonOpponentsRecord: "Common opponents record",
	confRecordIfSame: "Conference record (same conf)",
	divRecordIfSame: "Division record (same div)",
	divWinner: "Division winner",
	headToHeadRecord: "Head-to-head record",
	marginOfVictory: "Margin of victory",
	strengthOfVictory: "Strength of victory",
	strengthOfSchedule: "Strength of schedule",
	coinFlip: "Coin flip",
};

// This is only applied by default in hockey, but it's still used in all sports if "pts" are explicitly requested and there is no formula set
const DEFAULT_POINTS_FORMULA = "2*W+OTL+T";

const AD_DIVS = bySport({
	basketball: {
		mobile: "basketball-gm_mobile_leaderboard",
		leaderboard: "basketball-gm_leaderboard_atf",
		rectangle1: "basketball-gm_mrec_btf_1",
		rectangle2: "basketball-gm_mrec_btf_2",
		rail: "basketball-gm_right_rail",
	},
	football: {
		mobile: "football-gm_mobile_leaderboard",
		leaderboard: "football-gm_leaderboard_atf",
		rectangle1: "football-gm_mrec_btf_1",
		rectangle2: "football-gm_mrec_btf_2",
		rail: "football-gm_right_rail",
	},
	hockey: {
		mobile: "zen-gm_mobile_leaderboard",
		leaderboard: "zen-gm_leaderboard_atf",
		rectangle1: "zen-gm_mrec_btf_1",
		rectangle2: "zen-gm_mrec_btf_2",
		rail: "zen-gm_right_rail",
	},
});

const DEFAULT_JERSEY = bySport({
	basketball: "jersey3",
	football: "football",
	hockey: "hockey",
});

const JERSEYS = bySport({
	basketball: {
		jersey: "Plain",
		jersey2: "Bordered",
		jersey4: "Bordered 2",
		jersey3: "Solid horizontal",
		jersey5: "Pinstripes",
	},
	football: {
		football: "Default",
		football2: "Shoulder flair",
		football5: "Shoulder flair 2",
		football3: "Shoulder stripes",
		football4: "Low flair",
	},
	hockey: {
		hockey: "Stripe",
		hockey3: "Stripe 2",
		hockey4: "Stripe 3",
		hockey2: "Plain",
	},
});

// Target: 90% in playThroughInjuriesFactor
const DEFAULT_PLAY_THROUGH_INJURIES = bySport<[number, number]>({
	basketball: [0, 4],
	football: [0, 2],
	hockey: [0, 4],
});

const DAILY_SCHEDULE = `${
	TIME_BETWEEN_GAMES === "week" ? "Weekly" : "Daily"
} Schedule`;

export {
	AD_DIVS,
	AWARD_NAMES,
	COURT,
	DAILY_SCHEDULE,
	DEFAULT_CONFS,
	DEFAULT_DIVS,
	DEFAULT_JERSEY,
	DEFAULT_PLAY_THROUGH_INJURIES,
	DEFAULT_POINTS_FORMULA,
	DEFAULT_STADIUM_CAPACITY,
	ACCOUNT_API_URL,
	DIFFICULTY,
	DRAFT_BY_TEAM_OVR,
	EMAIL_ADDRESS,
	FACEBOOK_USERNAME,
	GAME_ACRONYM,
	GAME_NAME,
	GRACE_PERIOD,
	JERSEYS,
	MAX_SUPPORTED_LEAGUE_VERSION,
	MOOD_TRAITS,
	NO_LOTTERY_DRAFT_TYPES,
	PHASE,
	PLAYER,
	PHASE_TEXT,
	SPORT_HAS_LEGENDS,
	SPORT_HAS_REAL_PLAYERS,
	STRIPE_PUBLISHABLE_KEY,
	COMPOSITE_WEIGHTS,
	PLAYER_GAME_STATS,
	PLAYER_SUMMARY,
	PLAYER_STATS_TABLES,
	RATINGS,
	SIMPLE_AWARDS,
	POSITION_COUNTS,
	POSITIONS,
	SUBREDDIT_NAME,
	TEAM_STATS_TABLES,
	TIEBREAKERS,
	TIME_BETWEEN_GAMES,
	TWITTER_HANDLE,
	WEBSITE_PLAY,
	WEBSITE_ROOT,
};
