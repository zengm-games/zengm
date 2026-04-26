import type { SuperCol } from "../ui/components/DataTable/index.tsx";
import { bySport } from "./sportFunctions.ts";
import * as constantsBaseball from "./constants.baseball.ts";
import * as constantsBasketball from "./constants.basketball.ts";
import * as constantsFootball from "./constants.football.ts";
import * as constantsHockey from "./constants.hockey.ts";
import type { CompositeWeights, Phase, DraftType, MoodTrait } from "./types.ts";

export const ACCOUNT_API_URL =
	process.env.NODE_ENV === "development"
		? "http://account.basketball-gm.test"
		: bySport({
				basketball: "https://account.basketball-gm.com",
				football: "https://account.football-gm.com",
				default: "https://account.zengm.com",
			});

export const DIFFICULTY = {
	Easy: -0.25,
	Normal: 0,
	Hard: 0.25,
	Insane: 1,
};

export const DRAFT_BY_TEAM_OVR = bySport({
	baseball: true,
	basketball: false,
	football: true,
	hockey: true,
});

export const LEAGUE_DATABASE_VERSION = 71;

export const NO_LOTTERY_DRAFT_TYPES = new Set<DraftType>([
	"freeAgents",
	"noLottery",
	"noLotteryReverse",
	"random",
]);

export const PHASE = {
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
} satisfies Record<string, Phase>;

export const REMAINING_PLAYOFF_TEAMS_PHASES = new Set<Phase>([
	PHASE.REGULAR_SEASON,
	PHASE.AFTER_TRADE_DEADLINE,
	PHASE.PLAYOFFS,
]);

export const PLAYER = {
	FREE_AGENT: -1,
	UNDRAFTED: -2,
	RETIRED: -3,

	// Store current draft class here during fantasy draft
	UNDRAFTED_FANTASY_TEMP: -6,

	// Used for realStats when a team has been contracted
	DOES_NOT_EXIST: -7,

	// Used for summed up season stats for multiple teams
	TOT: -8,

	// THESE ARE OBSOLETE!
	UNDRAFTED_2: -4, // Next year's draft class
	UNDRAFTED_3: -5, // Next next year's draft class
};

export const PHASE_TEXT = {
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

export const STRIPE_PUBLISHABLE_KEY =
	process.env.NODE_ENV === "development"
		? "pk_test_Qbz0froGmHLp0dPCwHoYFY08"
		: "pk_live_Dmo7Vs6uSaoYHrFngr4lM0sa";

export const COMPOSITE_WEIGHTS = bySport<CompositeWeights>({
	baseball: constantsBaseball.COMPOSITE_WEIGHTS,
	basketball: constantsBasketball.COMPOSITE_WEIGHTS,
	football: constantsFootball.COMPOSITE_WEIGHTS,
	hockey: constantsHockey.COMPOSITE_WEIGHTS,
});

export const PLAYER_GAME_STATS = bySport<{
	[key: string]: {
		name: string;
		stats: string[];
		sortBy: string[];
	};
}>({
	baseball: constantsBaseball.PLAYER_GAME_STATS,
	basketball: constantsBasketball.PLAYER_GAME_STATS,
	football: constantsFootball.PLAYER_GAME_STATS,
	hockey: constantsHockey.PLAYER_GAME_STATS,
});

export const PLAYER_SUMMARY = bySport<{
	[key: string]: {
		name: string;
		onlyShowIf?: string[];
		stats: string[];
		superCols?: {
			colspan: number;
			desc: string;
			title: string;
		}[];
	};
}>({
	baseball: constantsBaseball.PLAYER_SUMMARY,
	basketball: constantsBasketball.PLAYER_SUMMARY,
	football: constantsFootball.PLAYER_SUMMARY,
	hockey: constantsHockey.PLAYER_SUMMARY,
});

export const PLAYER_STATS_TABLES = bySport<{
	[key: string]: {
		name: string;
		onlyShowIf?: string[];
		stats: string[];
		superCols?: SuperCol[];
	};
}>({
	baseball: constantsBaseball.PLAYER_STATS_TABLES,
	basketball: constantsBasketball.PLAYER_STATS_TABLES,
	football: constantsFootball.PLAYER_STATS_TABLES,
	hockey: constantsHockey.PLAYER_STATS_TABLES,
});

export const RATINGS = bySport<any[]>({
	baseball: constantsBaseball.RATINGS,
	basketball: constantsBasketball.RATINGS,
	football: constantsFootball.RATINGS,
	hockey: constantsHockey.RATINGS,
});

export const POSITION_COUNTS: {
	[key: string]: number;
} = bySport({
	baseball: constantsBaseball.POSITION_COUNTS,
	basketball: constantsBasketball.POSITION_COUNTS,
	football: constantsFootball.POSITION_COUNTS,
	hockey: constantsHockey.POSITION_COUNTS,
});

export const POSITIONS = bySport<any[]>({
	baseball: constantsBaseball.POSITIONS,
	basketball: constantsBasketball.POSITIONS,
	football: constantsFootball.POSITIONS,
	hockey: constantsHockey.POSITIONS,
});

export const TEAM_STATS_TABLES = bySport<
	Record<
		string,
		{
			name: string;
			stats: string[];
			superCols?: SuperCol[];
		}
	>
>({
	baseball: constantsBaseball.TEAM_STATS_TABLES,
	basketball: constantsBasketball.TEAM_STATS_TABLES,
	football: constantsFootball.TEAM_STATS_TABLES,
	hockey: constantsHockey.TEAM_STATS_TABLES,
});

export const TIME_BETWEEN_GAMES: string = bySport({
	football: "week",
	default: "day",
});

export const MOOD_TRAITS: Record<MoodTrait, string> = {
	F: "Fame",
	L: "Loyalty",
	$: "Money",
	W: "Winning",
};

export const SIMPLE_AWARDS = bySport<Readonly<string[]>>({
	baseball: constantsBaseball.SIMPLE_AWARDS,
	basketball: constantsBasketball.SIMPLE_AWARDS,
	football: constantsFootball.SIMPLE_AWARDS,
	hockey: constantsHockey.SIMPLE_AWARDS,
});

export const AWARD_NAMES = bySport<Record<string, string>>({
	baseball: constantsBaseball.AWARD_NAMES,
	basketball: constantsBasketball.AWARD_NAMES,
	football: constantsFootball.AWARD_NAMES,
	hockey: constantsHockey.AWARD_NAMES,
});

export const DEFAULT_CONFS = bySport({
	baseball: constantsBaseball.DEFAULT_CONFS,
	basketball: constantsBasketball.DEFAULT_CONFS,
	football: constantsFootball.DEFAULT_CONFS,
	hockey: constantsHockey.DEFAULT_CONFS,
});

export const DEFAULT_DIVS = bySport({
	baseball: constantsBaseball.DEFAULT_DIVS,
	basketball: constantsBasketball.DEFAULT_DIVS,
	football: constantsFootball.DEFAULT_DIVS,
	hockey: constantsHockey.DEFAULT_DIVS,
});

export const DEFAULT_STADIUM_CAPACITY = bySport({
	baseball: 50000,
	basketball: 25000,
	football: 70000,
	hockey: 17500,
});

export const COURT = bySport({
	baseball: "field",
	basketball: "court",
	football: "field",
	hockey: "ice",
});

export const EMAIL_ADDRESS = "jeremy@zengm.com";

export const GAME_ACRONYM = bySport({
	baseball: "ZGMB",
	basketball: "BBGM",
	football: "FBGM",
	hockey: "ZGMH",
});

export const GAME_NAME = bySport({
	baseball: "ZenGM Baseball",
	basketball: "Basketball GM",
	football: "Football GM",
	hockey: "ZenGM Hockey",
});

export const SUBREDDIT_NAME = bySport({
	baseball: "ZenGMBaseball",
	basketball: "BasketballGM",
	football: "Football_GM",
	hockey: "ZenGMHockey",
});

export const TWITTER_HANDLE = bySport({
	basketball: "basketball_gm",
	football: "FootballGM_Game",
	default: "ZenGMGames",
});

export const FACEBOOK_USERNAME = bySport({
	basketball: "basketball.general.manager",
	football: "football.general.manager",
	default: "ZenGMGames",
});

export const REAL_PLAYERS_INFO = bySport({
	baseball: undefined,
	basketball: {
		legends: true,
		FIRST_SEASON_WITH_ALEXNOOB_ROSTERS: 2020,
		MIN_SEASON: 1947,
		MAX_SEASON: 2026,
		MAX_PHASE: PHASE.PLAYOFFS as Phase,
	},
	football: undefined,
	hockey: undefined,
});

export const WEBSITE_PLAY = bySport({
	baseball: "baseball.zengm.com",
	basketball: "play.basketball-gm.com",
	football: "play.football-gm.com",
	hockey: "hockey.zengm.com",
});

export const WEBSITE_ROOT = bySport({
	baseball: "zengm.com/baseball",
	basketball: "basketball-gm.com",
	football: "football-gm.com",
	hockey: "zengm.com/hockey",
});

// For subscribers who have not renewed yet, give them a 3 day grace period before showing ads again, because sometimes it takes a little extra tim for the payment to process
export const GRACE_PERIOD = 60 * 60 * 24 * 3;

export const TIEBREAKERS = {
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
export const DEFAULT_POINTS_FORMULA = "2*W+OTL+T";

export const AD_DIVS = bySport({
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
	default: {
		mobile: "zen-gm_mobile_leaderboard",
		leaderboard: "zen-gm_leaderboard_atf",
		rectangle1: "zen-gm_mrec_btf_1",
		rectangle2: "zen-gm_mrec_btf_2",
		rail: "zen-gm_right_rail",
	},
});

export const DEFAULT_JERSEY = bySport({
	baseball: "baseball2:hat2",
	basketball: "jersey3",
	football: "football",
	hockey: "hockey",
});

export const JERSEYS = bySport({
	baseball: {
		"baseball:hat": "Solid jersey, solid hat",
		"baseball:hat2": "Solid jersey, brim hat",
		"baseball:hat3": "Solid jersey, multi hat",
		"baseball2:hat": "Accent jersey, solid hat",
		"baseball2:hat2": "Accent jersey, brim hat",
		"baseball2:hat3": "Accent jersey, multi hat",
		"baseball3:hat": "Pinstripe jersey, solid hat",
		"baseball3:hat2": "Pinstripe jersey, brim hat",
		"baseball3:hat3": "Pinstripe jersey, multi hat",
		"baseball4:hat": "Secondary jersey, solid hat",
		"baseball4:hat2": "Secondary jersey, brim hat",
		"baseball4:hat3": "Secondary jersey, multi hat",
	},
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
export const DEFAULT_PLAY_THROUGH_INJURIES = bySport<[number, number]>({
	baseball: [0, 4],
	basketball: [0, 4],
	football: [0, 2],
	hockey: [0, 4],
});

export const DAILY_SCHEDULE = `${
	TIME_BETWEEN_GAMES === "week" ? "Weekly" : "Daily"
} Schedule`;

// Basketball has other events, but other sports are just a game
export const ALL_STAR_GAME_ONLY = bySport({
	baseball: true,
	basketball: false,
	football: true,
	hockey: true,
});

export const DEFAULT_PHASE_CHANGE_REDIRECTS = [1, 3, 4, 5, 7, 8] as Phase[];

export const EXHIBITION_GAME_SETTINGS = [
	"maxOvertimes",
	"shootoutRounds",
	"maxOvertimesPlayoffs",
	"shootoutRoundsPlayoffs",
	"dh",
	"numPlayersOnCourt",
	"foulsNeededToFoulOut",
	"numPlayersOnCourt",
	"quarterLength",
	"overtimeLength",
	"overtimeLengthPlayoffs",
	"numPeriods",
	"pace",
	"homeCourtAdvantage",
	"elam",
	"elamMinutes",
	"elamOvertime",
	"elamPoints",
	"foulsUntilBonus",
	"turnoverFactor",
	"stealFactor",
	"threePointTendencyFactor",
	"threePointAccuracyFactor",
	"twoPointAccuracyFactor",
	"ftAccuracyFactor",
	"foulRateFactor",
	"threePointers",
	"blockFactor",
	"threePointers",
	"orbFactor",
	"injuryRate",
	"assistFactor",
	"foulFactor",
	"groundFactor",
	"lineFactor",
	"flyFactor",
	"powerFactor",
	"stealFactor",
	"throwOutFactor",
	"strikeFactor",
	"balkFactor",
	"wildPitchFactor",
	"passedBallFactor",
	"hitByPitchFactor",
	"swingFactor",
	"contactFactor",
	"hitFactor",
	"errorFactor",
	"fantasyPoints",
	"passFactor",
	"rushYdsFactor",
	"passYdsFactor",
	"completionFactor",
	"scrambleFactor",
	"sackFactor",
	"fumbleFactor",
	"intFactor",
	"fgAccuracyFactor",
	"fourthDownFactor",
	"onsideFactor",
	"onsideRecoveryFactor",
	"giveawayFactor",
	"takeawayFactor",
	"blockFactor",
	"deflectionFactor",
	"saveFactor",
	"gender",
	"neutralSite",
	"scrimmageTouchbackKickoff",
	"twoPointConversions",
	"footballOvertime",
	"footballOvertimePlayoffs",
] as const;

export const MOBILE_AD_BOTTOM_MARGIN = 52;

export const DEPTH_CHART_NAME = bySport({
	baseball: "Batting Order",
	basketball: undefined,
	football: "Depth Chart",
	hockey: "Lines",
});

export const DEFAULT_TEAM_COLORS: [string, string, string] = [
	"#000000",
	"#cccccc",
	"#ffffff",
];

export const STARTING_NUM_TIMEOUTS = bySport({
	baseball: undefined,
	football: 3,
	hockey: undefined,

	// Should actually be 7, but since timeouts are only used at the end of the game currently, it's silly to have those extra 5 timeouts lying around all game
	basketball: 2,
});

export const VIDEO_ADS = false;
export const VIDEO_AD_PADDING = 225 + 10 + 10;

export const SKILLS = bySport<Record<string, string>>({
	baseball: {
		Pp: "Power pitcher",
		Pf: "Finesse pitcher",
		Pw: "Workhorse pitcher",
		Ri: "Infield range",
		Ro: "Outfield range",
		Dc: "Catcher defense",
		D1: "First base defense",
		Dg: "Ground ball fielding",
		Df: "Fly ball fielding",
		A: "Strong arm",
		Hp: "Power hitter",
		Hc: "Contact hitter",
		E: "Good eye",
		S: "Speed",
	},
	basketball: {
		"3": "Three point shooter",
		A: "Athlete",
		B: "Ball handler",
		Di: "Interior defender",
		Dp: "Perimeter defender",
		Po: "Post scorer",
		Ps: "Passer",
		R: "Rebounder",
		V: "Volume scorer",
	},
	football: {
		Pa: "Accurate passer",
		Pd: "Deep passer",
		Ps: "Smart passer",
		A: "Athletic",
		X: "Explosive runner",
		H: "Hands",
		Bp: "Pass blocker",
		Br: "Run blocker",
		PR: "Pass rusher",
		RS: "Run stopper",
		L: "Lockdown coverage",
	},
	hockey: {
		Pm: "Playmaker",
		Pw: "Power",
		G: "Grinder",
		E: "Enforcer",
		S: "Sniper",
	},
});

export const NOT_REAL_POSITIONS = bySport({
	baseball: ["DH"],
	basketball: [],
	football: ["KR", "PR"],
	hockey: [],
});

export const COLA_ALPHA = 1000;
export const COLA_OPT_OUT_PENALTY = 2000;

export const ERROR_MESSAGE_ONE_TAB =
	"Your browser only supports opening a league in one tab at a time. If this league is not open in another tab, please wait a few seconds and reload.";
export const ERROR_MESSAGE_UNDEFINED_SEASON =
	"Undefined season - an error may have occurred while creating this league";
