import {
	DEFAULT_CONFS,
	DEFAULT_DIVS,
	DEFAULT_POINTS_FORMULA,
	DEFAULT_STADIUM_CAPACITY,
} from "./constants";
import isSport from "./isSport";
import type {
	GameAttributeKey,
	GameAttributesLeagueWithHistory,
} from "./types";

const wrap = <T>(value: T) => [
	{
		start: -Infinity,
		value,
	},
];

// gameAttributes is mixed up between league settings, game state, teams, and cache
export const gameAttributesKeysGameState: GameAttributeKey[] = [
	"phase",
	"nextPhase",
	"gameOver",
	"godMode",
	"godModeInPast",
	"otherTeamsWantToHire",
	"lowestDifficulty",
	"difficulty",
	"gracePeriodEnd",
	"lid",
	"userTid",
	"userTids",
	"season",
	"startingSeason",
	"numDraftPicksCurrent",
	"expansionDraft",
	"autoRelocate",
];
export const gameAttributesKeysTeams: GameAttributeKey[] = ["confs", "divs"];
export const gameAttributesCache: GameAttributeKey[] = [
	"numTeams",
	"numActiveTeams",
	"teamInfoCache",
];

const gameAttributesKeysSportSpecific = {
	baseball: [
		"dh",
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
	] as GameAttributeKey[],
	basketball: [
		"threePointers",
		"threePointTendencyFactor",
		"threePointAccuracyFactor",
		"twoPointAccuracyFactor",
		"blockFactor",
		"stealFactor",
		"turnoverFactor",
		"orbFactor",
		"assistFactor",
		"realPlayerDeterminism",
		"foulRateFactor",
		"foulsNeededToFoulOut",
		"foulsUntilBonus",
		"elam",
		"elamASG",
		"elamMinutes",
		"elamOvertime",
		"elamPoints",
		"randomDebutsForever",
		"realDraftRatings",
		"numPlayersDunk",
		"numPlayersThree",
		"quarterLength",
		"ties",
		"numPlayersOnCourt",
		"pace",
		"allStarDunk",
		"allStarThree",
	] as GameAttributeKey[],
	football: [
		"fantasyPoints",
		"foulRateFactor",
		"quarterLength",
		"ties",
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
		"pace",
	] as GameAttributeKey[],
	hockey: [
		"quarterLength",
		"ties",
		"hitFactor",
		"giveawayFactor",
		"takeawayFactor",
		"blockFactor",
		"deflectionFactor",
		"saveFactor",
		"assistFactor",
		"pace",
	] as GameAttributeKey[],
};
export const gameAttributesKeysOtherSports = new Set<GameAttributeKey>();
for (const [sport, keys] of Object.entries(gameAttributesKeysSportSpecific)) {
	if (sport !== process.env.SPORT) {
		for (const key of keys) {
			if (!gameAttributesKeysSportSpecific[process.env.SPORT].includes(key)) {
				gameAttributesKeysOtherSports.add(key);
			}
		}
	}
}

const defaultGameAttributes: GameAttributesLeagueWithHistory = {
	phase: 0,
	nextPhase: undefined, // Used only for fantasy draft
	playerBioInfo: undefined,
	injuries: undefined,
	tragicDeaths: undefined,
	daysLeft: 0, // Used only for free agency
	gameOver: false,
	godMode: false,
	godModeInPast: false,
	salaryCap: 125000, // [thousands of dollars]
	minPayroll: 80000, // [thousands of dollars]
	luxuryPayroll: 140000, // [thousands of dollars]
	luxuryTax: 1.5,
	minContract: 1000, // [thousands of dollars]
	maxContract: 42000, // [thousands of dollars]
	minContractLength: 1,
	maxContractLength: 5,
	minRosterSize: 10,
	maxRosterSize: 15,
	softCapTradeSalaryMatch: 125,
	numGames: 82, // per season
	numGamesDiv: 16,
	numGamesConf: 36,
	otherTeamsWantToHire: false,
	numPeriods: 4, // per game
	quarterLength: 12, // [minutes]
	confs: wrap(DEFAULT_CONFS),
	divs: wrap(DEFAULT_DIVS),
	numGamesPlayoffSeries: wrap([7, 7, 7, 7]),
	numPlayoffByes: wrap(0),
	aiTradesFactor: 1,
	autoDeleteOldBoxScores: true,
	stopOnInjury: false,
	stopOnInjuryGames: 20,
	// According to data/injuries.ods, 0.25 injuries occur every game. Divided over 10 players and ~200 possessions, that means each player on the court has P = 0.25 / 10 / 200 = 0.000125 probability of being injured this play.
	injuryRate: 0.25 / 10 / 200,
	homeCourtAdvantage: 1,
	// The tragic death rate is the probability that a player will die a tragic death on a given regular season day. Yes, this only happens in the regular season. With roughly 100 days in a season, the default is about one death every 50 years.
	tragicDeathRate: 1 / (100 * 50),
	// The probability that a new player will be the son or brother of an existing player. In practice, the observed number may be smaller than this because sometimes a valid match will not be found.
	sonRate: 0.02,
	brotherRate: 0.02,
	forceRetireAge: 0,
	minRetireAge: 26,
	groupScheduleSeries: false,

	salaryCapType: "soft",

	// This enables ties in the UI and game data saving, but GameSim still needs to actually return ties. In other words... you can't just enable this for basketball and have ties happen in basketball!
	ties: wrap(false),
	otl: wrap(false),

	draftType: "nba2019",
	draftLotteryCustomChances: [
		140, 140, 140, 125, 105, 90, 75, 60, 45, 30, 20, 15, 10, 5,
	],
	draftLotteryCustomNumPicks: 4,
	numDraftRounds: 2,
	draftAges: [19, 22],
	defaultStadiumCapacity: DEFAULT_STADIUM_CAPACITY,
	playersRefuseToNegotiate: true,
	allStarGame: 0.7,
	allStarNum: 12,
	allStarType: "draft",
	allStarDunk: true,
	allStarThree: true,
	budget: true,
	numSeasonsFutureDraftPicks: 4,
	foulRateFactor: 1,
	foulsNeededToFoulOut: 6,
	foulsUntilBonus: [5, 4, 2],
	rookieContractLengths: [3, 2],
	rookiesCanRefuse: true,

	pace: 100,
	threePointers: true,
	threePointTendencyFactor: 1,
	threePointAccuracyFactor: 1,
	twoPointAccuracyFactor: 1,
	blockFactor: 1,
	stealFactor: 1,
	turnoverFactor: 1,
	orbFactor: 1,
	expansionDraft: { phase: "setup" },

	challengeNoDraftPicks: false,
	challengeNoFreeAgents: false,
	challengeNoRatings: false,
	challengeNoTrades: false,
	challengeLoseBestPlayer: false,
	challengeFiredLuxuryTax: false,
	challengeFiredMissPlayoffs: false,
	challengeSisyphusMode: false,
	challengeThanosMode: 0,
	thanosCooldownEnd: undefined,
	repeatSeason: undefined,
	equalizeRegions: false,
	realPlayerDeterminism: 0,
	spectator: false,
	elam: false,
	elamASG: true,
	elamMinutes: 4,
	elamOvertime: false,
	elamPoints: 8,
	playerMoodTraits: true,
	numPlayersOnCourt: 5,
	aiJerseyRetirement: true,
	tiebreakers: wrap([
		"headToHeadRecord",
		"divWinner",
		"divRecordIfSame",
		"confRecordIfSame",
		"marginOfVictory",
		"coinFlip",
	]),
	hofFactor: 1,
	tradeDeadline: 0.6,
	pointsFormula: wrap(""),
	randomDebutsForever: undefined,
	realDraftRatings: undefined,
	hideDisabledTeams: false,
	goatFormula: undefined,
	goatSeasonFormula: undefined,
	inflationAvg: 0,
	inflationMax: 0,
	inflationMin: 0,
	inflationStd: 0,
	riggedLottery: undefined,
	numDraftPicksCurrent: undefined,
	playoffsByConf: true,
	playoffsNumTeamsDiv: wrap(0),
	playoffsReseed: false,
	playIn: true,
	numPlayersDunk: 4,
	numPlayersThree: 8,
	draftPickAutoContract: true,
	draftPickAutoContractPercent: 25,
	draftPickAutoContractRounds: 1,
	dh: "all",
	gender: "male",
	heightFactor: 1,
	weightFactor: 1,
	numWatchColors: 1,
	/*autoExpandProb: 1,
	autoExpandNumTeams: 2,
	autoExpandGeo: "naFirst",*/
	autoRelocate: undefined,
	autoRelocateProb: 0,
	autoRelocateGeo: "naFirst",
	autoRelocateRebrand: true,
	autoRelocateRealign: true,

	// These will always be overwritten when creating a league, just here for TypeScript
	lid: 0,
	userTid: [
		{
			start: -Infinity,
			value: 0,
		},
	],
	userTids: [0],
	season: 0,
	startingSeason: 0,
	teamInfoCache: [],
	gracePeriodEnd: 0,
	numTeams: 0,
	numActiveTeams: 0,
	difficulty: 0, // See constants.DIFFICULTY for values
	lowestDifficulty: 0,
	fantasyPoints: undefined,

	// These are only for FBGM, but for TypeScript define them here
	passFactor: 1,
	rushYdsFactor: 1,
	passYdsFactor: 1,
	completionFactor: 1,
	scrambleFactor: 1,
	sackFactor: 1,
	fumbleFactor: 1,
	intFactor: 1,
	fgAccuracyFactor: 1,
	fourthDownFactor: 1,
	onsideFactor: 1,
	onsideRecoveryFactor: 1,

	// These are only for ZGMH, but for TypeScript define them here
	hitFactor: 1,
	giveawayFactor: 1,
	takeawayFactor: 1,
	deflectionFactor: 1,
	saveFactor: 1,
	assistFactor: 1,

	// These are only for ZGMB, but for TypeScript define them here
	foulFactor: 1,
	groundFactor: 1,
	lineFactor: 1,
	flyFactor: 1,
	powerFactor: 1,
	throwOutFactor: 1,
	strikeFactor: 1,
	balkFactor: 1,
	wildPitchFactor: 1,
	passedBallFactor: 1,
	hitByPitchFactor: 1,
	swingFactor: 1,
	contactFactor: 1,
};

// Extra condition for NODE_ENV is because we use this export only in tests, so we don't want it in the basketball bundle!
export const footballOverrides: Partial<GameAttributesLeagueWithHistory> =
	process.env.NODE_ENV === "test" || isSport("football")
		? {
				numGames: 17,
				numGamesDiv: 6,
				numGamesConf: 6,
				quarterLength: 15,
				numGamesPlayoffSeries: wrap([1, 1, 1, 1]),
				numPlayoffByes: wrap(2),
				stopOnInjuryGames: 1,
				salaryCapType: "hard",
				ties: wrap(true),
				draftType: "noLottery",
				numDraftRounds: 7,
				draftAges: [21, 22],
				salaryCap: 200000,
				minPayroll: 150000,
				luxuryPayroll: 250000,
				minContract: 500,
				maxContract: 30000,
				minRosterSize: 40,
				maxRosterSize: 55,
				// Arbitrary - 2 injuries per game. Divide over 1000 plays
				injuryRate: 2 / 1000,
				// The tragic death rate is the probability that a player will die a tragic death on a given regular season day. Yes, this only happens in the regular season. With roughly 20 days in a season, the default is about one death every 50 years.
				tragicDeathRate: 1 / (20 * 50),
				sonRate: 0.005,
				brotherRate: 0.005,
				allStarGame: -1,
				allStarNum: 44,
				allStarType: "byConf",
				numPlayersOnCourt: 11,
				tiebreakers: wrap([
					"headToHeadRecord",
					"divRecordIfSame",
					"commonOpponentsRecord",
					"confRecordIfSame",
					"strengthOfVictory",
					"strengthOfSchedule",
					"marginOfVictory",
					"coinFlip",
				]),
				playoffsReseed: true,
				playoffsNumTeamsDiv: wrap(1),
				playIn: false,
				fantasyPoints: "standard",
				draftPickAutoContract: false,
				pace: 1,
		  }
		: {};

export const hockeyOverrides: Partial<GameAttributesLeagueWithHistory> =
	process.env.NODE_ENV === "test" || isSport("hockey")
		? {
				numGamesDiv: 26,
				numGamesConf: 24,
				quarterLength: 20,
				numPeriods: 3,
				salaryCapType: "hard",
				salaryCap: 80000,
				minPayroll: 60000,
				luxuryPayroll: 90000,
				minContract: 500,
				maxContract: 13000,
				minRosterSize: 24,
				maxRosterSize: 26,
				// Injury rate per player per possession, basically. But it's a little more complicated than that.
				injuryRate: 1 / 10000,
				draftType: "nhl2021",
				numDraftRounds: 4,
				draftAges: [18, 21],
				allStarNum: 20,
				allStarType: "byConf",
				numPlayersOnCourt: 6,
				otl: wrap(true),
				pointsFormula: wrap(DEFAULT_POINTS_FORMULA),
				playoffsNumTeamsDiv: wrap(3),
				playIn: false,
				draftPickAutoContractPercent: 10,
				draftPickAutoContractRounds: 2,
				rookieContractLengths: [3],
				pace: 1,
		  }
		: {};

// Extra condition for NODE_ENV is because we use this export only in tests, so we don't want it in the basketball bundle!
export const baseballOverrides: Partial<GameAttributesLeagueWithHistory> =
	process.env.NODE_ENV === "test" || isSport("baseball")
		? {
				numGames: 162,
				numGamesDiv: 76,
				numGamesConf: null,
				numGamesPlayoffSeries: wrap([3, 5, 7, 7]),
				numPlayoffByes: wrap(4),
				numPeriods: 9,
				salaryCapType: "none",
				draftType: "mlb2022",
				numDraftRounds: 5,
				draftAges: [18, 22],
				salaryCap: 175000,
				minPayroll: 150000,
				luxuryPayroll: 200000,
				minContract: 500,
				maxContract: 30000,
				minRosterSize: 35,
				maxRosterSize: 40,
				// Arbitrary, spread over 40 plate appearances per game
				injuryRate: 0.018 / 40,
				// 200 days per season, 1 tragic death per 50 years
				tragicDeathRate: 1 / (200 * 50),
				allStarNum: 24,
				allStarType: "byConf",
				numPlayersOnCourt: 9,
				playoffsNumTeamsDiv: wrap(1),
				playIn: false,
				draftPickAutoContractPercent: 20,
				draftPickAutoContractRounds: 4,
				draftPickAutoContract: false,
				groupScheduleSeries: true,
		  }
		: {};

if (isSport("football")) {
	Object.assign(defaultGameAttributes, footballOverrides);
} else if (isSport("hockey")) {
	Object.assign(defaultGameAttributes, hockeyOverrides);
} else if (isSport("baseball")) {
	Object.assign(defaultGameAttributes, baseballOverrides);
}

export default defaultGameAttributes;
