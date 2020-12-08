import type { GameAttributesLeagueWithHistory } from "../../common/types";

const defaultGameAttributes: GameAttributesLeagueWithHistory = {
	phase: 0,
	nextPhase: undefined, // Used only for fantasy draft
	playerBioInfo: undefined,
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
	otherTeamsWantToHire: false,
	quarterLength: 12, // [minutes]
	confs: [
		{
			start: -Infinity,
			value: [
				{
					cid: 0,
					name: "Eastern Conference",
				},
				{
					cid: 1,
					name: "Western Conference",
				},
			],
		},
	],
	divs: [
		{
			start: -Infinity,
			value: [
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
			],
		},
	],
	numGamesPlayoffSeries: [
		{
			start: -Infinity,
			value: [7, 7, 7, 7],
		},
	],
	numPlayoffByes: [
		{
			start: -Infinity,
			value: 0,
		},
	],
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

	easyDifficultyInPast: false,
	hardCap: false,
	// This enables ties in the UI and game data saving, but GameSim still needs to actually return ties. In other words... you can't just enable this for basketball and have ties happen in basketball!
	ties: [
		{
			start: -Infinity,
			value: false,
		},
	],
	draftType: "nba2019",
	numDraftRounds: 2,
	defaultStadiumCapacity: 25000,
	playersRefuseToNegotiate: true,
	allStarGame: true,
	budget: true,
	numSeasonsFutureDraftPicks: 4,
	foulRateFactor: 1,
	foulsNeededToFoulOut: 6,
	rookieContractLengths: [3, 2],
	rookiesCanRefuse: true,

	pace: 100,
	threePointers: true,
	threePointTendencyFactor: 1,
	threePointAccuracyFactor: 1,
	twoPointAccuracyFactor: 1,
	expansionDraft: { phase: "setup" },

	challengeNoDraftPicks: false,
	challengeNoFreeAgents: false,
	challengeNoRatings: false,
	challengeNoTrades: false,
	challengeLoseBestPlayer: false,
	challengeFiredLuxuryTax: false,
	challengeFiredMissPlayoffs: false,
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
	keepRosterSorted: false,

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
	leagueName: "",
	teamInfoCache: [],
	gracePeriodEnd: 0,
	numTeams: 0,
	numActiveTeams: 0,
	difficulty: 0, // See constants.DIFFICULTY for values
	tradeDeadline: 0.6,
};

// Extra condition for NODE_ENV is because we use this export only in tests, so we don't want it in the basketball bundle!
export const footballOverrides =
	process.env.NODE_ENV === "test" || process.env.SPORT === "football"
		? {
				numGames: 16,
				quarterLength: 15,
				confs: [
					{
						cid: 0,
						name: "American Conference",
					},
					{
						cid: 1,
						name: "National Conference",
					},
				],
				divs: [
					{
						did: 0,
						cid: 0,
						name: "East",
					},
					{
						did: 1,
						cid: 0,
						name: "North",
					},
					{
						did: 2,
						cid: 0,
						name: "South",
					},
					{
						did: 3,
						cid: 0,
						name: "West",
					},
					{
						did: 4,
						cid: 1,
						name: "East",
					},
					{
						did: 5,
						cid: 1,
						name: "North",
					},
					{
						did: 6,
						cid: 1,
						name: "South",
					},
					{
						did: 7,
						cid: 1,
						name: "West",
					},
				],
				numGamesPlayoffSeries: [1, 1, 1, 1],
				numPlayoffByes: 4,
				stopOnInjuryGames: 1,
				hardCap: true,
				ties: [
					{
						start: -Infinity,
						value: true,
					},
				],
				draftType: "noLottery",
				numDraftRounds: 7,
				defaultStadiumCapacity: 70000,
				salaryCap: 200000,
				minPayroll: 150000,
				minContract: 500,
				maxContract: 30000,
				minRosterSize: 40,
				maxRosterSize: 53,
				// Arbitrary - 2 injuries per game. Divide over 1000 plays
				injuryRate: 2 / 1000,
				// The tragic death rate is the probability that a player will die a tragic death on a given regular season day. Yes, this only happens in the regular season. With roughly 20 days in a season, the default is about one death every 50 years.
				tragicDeathRate: 1 / (20 * 50),
				sonRate: 0.005,
				brotherRate: 0.005,
				allStarGame: false,
		  }
		: {};

if (process.env.SPORT === "football") {
	Object.assign(defaultGameAttributes, footballOverrides);
}

export default defaultGameAttributes;
