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
];
export const gameAttributesKeysTeams: GameAttributeKey[] = ["confs", "divs"];
export const gameAttributesCache: GameAttributeKey[] = [
	"numTeams",
	"numActiveTeams",
	"teamInfoCache",
];

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
	salaryCap: 90000, // [thousands of dollars]
	minPayroll: 60000, // [thousands of dollars]
	luxuryPayroll: 100000, // [thousands of dollars]
	luxuryTax: 1.5,
	minContract: 750, // [thousands of dollars]
	maxContract: 30000, // [thousands of dollars]
	minContractLength: 1,
	maxContractLength: 5,
	minRosterSize: 10,
	maxRosterSize: 15,
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

	hardCap: false,

	// This enables ties in the UI and game data saving, but GameSim still needs to actually return ties. In other words... you can't just enable this for basketball and have ties happen in basketball!
	ties: wrap(false),
	otl: wrap(false),

	draftType: "nba2019",
	numDraftRounds: 2,
	draftAges: [19, 22],
	defaultStadiumCapacity: DEFAULT_STADIUM_CAPACITY,
	playersRefuseToNegotiate: true,
	allStarGame: 0.7,
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
	challengeThanosMode: false,
	thanosCooldownEnd: undefined,
	repeatSeason: undefined,
	equalizeRegions: false,
	realPlayerDeterminism: 0,
	spectator: false,
	elam: false,
	elamASG: true,
	elamMinutes: 4,
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
				hardCap: true,
				ties: wrap(true),
				draftType: "noLottery",
				numDraftRounds: 7,
				draftAges: [21, 22],
				salaryCap: 200000,
				minPayroll: 150000,
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
				allStarGame: null,
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
		  }
		: {};

export const hockeyOverrides: Partial<GameAttributesLeagueWithHistory> =
	process.env.NODE_ENV === "test" || isSport("hockey")
		? {
				numGamesDiv: 26,
				numGamesConf: 24,
				quarterLength: 20,
				numPeriods: 3,
				hardCap: true,
				salaryCap: 80000,
				minPayroll: 60000,
				minContract: 500,
				maxContract: 13000,
				minRosterSize: 24,
				maxRosterSize: 26,
				// Injury rate per player per possession, basically. But it's a little more complicated than that.
				injuryRate: 1 / 10000,
				draftType: "nhl2017",
				numDraftRounds: 4,
				draftAges: [18, 21],
				allStarGame: null,
				numPlayersOnCourt: 6,
				otl: wrap(true),
				pointsFormula: wrap(DEFAULT_POINTS_FORMULA),
				playoffsNumTeamsDiv: wrap(3),
				playIn: false,
		  }
		: {};

if (isSport("football")) {
	Object.assign(defaultGameAttributes, footballOverrides);
} else if (isSport("hockey")) {
	Object.assign(defaultGameAttributes, hockeyOverrides);
}

export default defaultGameAttributes;
