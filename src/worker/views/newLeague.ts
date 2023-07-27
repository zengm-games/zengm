import { idb } from "../db";
import type { ViewInput, RealTeamInfo } from "../../common/types";
import {
	defaultGameAttributes,
	defaultInjuries,
	defaultTragicDeaths,
	env,
	getNewLeagueLid,
	newLeagueGodModeLimits,
} from "../util";
import type { Settings } from "./settings";
import { unwrapGameAttribute } from "../../common";
import goatFormula from "../util/goatFormula";

const getDefaultRealStats = () => {
	return env.mobile ? "none" : "allActiveHOF";
};

export const getDefaultSettings = () => {
	const defaultSettings: Omit<Settings, "numActiveTeams"> = {
		godMode: unwrapGameAttribute(defaultGameAttributes, "godMode"),
		godModeInPast: unwrapGameAttribute(defaultGameAttributes, "godModeInPast"),
		numGames: unwrapGameAttribute(defaultGameAttributes, "numGames"),
		numGamesDiv: unwrapGameAttribute(defaultGameAttributes, "numGamesDiv"),
		numGamesConf: unwrapGameAttribute(defaultGameAttributes, "numGamesConf"),
		quarterLength: unwrapGameAttribute(defaultGameAttributes, "quarterLength"),
		maxRosterSize: unwrapGameAttribute(defaultGameAttributes, "maxRosterSize"),
		minRosterSize: unwrapGameAttribute(defaultGameAttributes, "minRosterSize"),
		salaryCap: unwrapGameAttribute(defaultGameAttributes, "salaryCap"),
		minPayroll: unwrapGameAttribute(defaultGameAttributes, "minPayroll"),
		luxuryPayroll: unwrapGameAttribute(defaultGameAttributes, "luxuryPayroll"),
		luxuryTax: unwrapGameAttribute(defaultGameAttributes, "luxuryTax"),
		minContract: unwrapGameAttribute(defaultGameAttributes, "minContract"),
		maxContract: unwrapGameAttribute(defaultGameAttributes, "maxContract"),
		minContractLength: unwrapGameAttribute(
			defaultGameAttributes,
			"minContractLength",
		),
		maxContractLength: unwrapGameAttribute(
			defaultGameAttributes,
			"maxContractLength",
		),
		aiTradesFactor: unwrapGameAttribute(
			defaultGameAttributes,
			"aiTradesFactor",
		),
		injuryRate: unwrapGameAttribute(defaultGameAttributes, "injuryRate"),
		homeCourtAdvantage: unwrapGameAttribute(
			defaultGameAttributes,
			"homeCourtAdvantage",
		),
		rookieContractLengths: unwrapGameAttribute(
			defaultGameAttributes,
			"rookieContractLengths",
		),
		rookiesCanRefuse: unwrapGameAttribute(
			defaultGameAttributes,
			"rookiesCanRefuse",
		),
		tragicDeathRate: unwrapGameAttribute(
			defaultGameAttributes,
			"tragicDeathRate",
		),
		brotherRate: unwrapGameAttribute(defaultGameAttributes, "brotherRate"),
		sonRate: unwrapGameAttribute(defaultGameAttributes, "sonRate"),
		forceRetireAge: unwrapGameAttribute(
			defaultGameAttributes,
			"forceRetireAge",
		),
		salaryCapType: unwrapGameAttribute(defaultGameAttributes, "salaryCapType"),
		numGamesPlayoffSeries: unwrapGameAttribute(
			defaultGameAttributes,
			"numGamesPlayoffSeries",
		),
		numPlayoffByes: unwrapGameAttribute(
			defaultGameAttributes,
			"numPlayoffByes",
		),
		draftType: unwrapGameAttribute(defaultGameAttributes, "draftType"),
		draftAges: unwrapGameAttribute(defaultGameAttributes, "draftAges"),
		playersRefuseToNegotiate: unwrapGameAttribute(
			defaultGameAttributes,
			"playersRefuseToNegotiate",
		),
		allStarGame: unwrapGameAttribute(defaultGameAttributes, "allStarGame"),
		allStarNum: unwrapGameAttribute(defaultGameAttributes, "allStarNum"),
		allStarType: unwrapGameAttribute(defaultGameAttributes, "allStarType"),
		budget: unwrapGameAttribute(defaultGameAttributes, "budget"),
		numSeasonsFutureDraftPicks: unwrapGameAttribute(
			defaultGameAttributes,
			"numSeasonsFutureDraftPicks",
		),
		foulRateFactor: unwrapGameAttribute(
			defaultGameAttributes,
			"foulRateFactor",
		),
		foulsNeededToFoulOut: unwrapGameAttribute(
			defaultGameAttributes,
			"foulsNeededToFoulOut",
		),
		foulsUntilBonus: unwrapGameAttribute(
			defaultGameAttributes,
			"foulsUntilBonus",
		),
		threePointers: unwrapGameAttribute(defaultGameAttributes, "threePointers"),
		pace: unwrapGameAttribute(defaultGameAttributes, "pace"),
		threePointTendencyFactor: unwrapGameAttribute(
			defaultGameAttributes,
			"threePointTendencyFactor",
		),
		threePointAccuracyFactor: unwrapGameAttribute(
			defaultGameAttributes,
			"threePointAccuracyFactor",
		),
		twoPointAccuracyFactor: unwrapGameAttribute(
			defaultGameAttributes,
			"twoPointAccuracyFactor",
		),
		blockFactor: unwrapGameAttribute(defaultGameAttributes, "blockFactor"),
		stealFactor: unwrapGameAttribute(defaultGameAttributes, "stealFactor"),
		turnoverFactor: unwrapGameAttribute(
			defaultGameAttributes,
			"turnoverFactor",
		),
		orbFactor: unwrapGameAttribute(defaultGameAttributes, "orbFactor"),
		challengeNoDraftPicks: unwrapGameAttribute(
			defaultGameAttributes,
			"challengeNoDraftPicks",
		),
		challengeNoFreeAgents: unwrapGameAttribute(
			defaultGameAttributes,
			"challengeNoFreeAgents",
		),
		challengeNoTrades: unwrapGameAttribute(
			defaultGameAttributes,
			"challengeNoTrades",
		),
		challengeLoseBestPlayer: unwrapGameAttribute(
			defaultGameAttributes,
			"challengeLoseBestPlayer",
		),
		challengeNoRatings: unwrapGameAttribute(
			defaultGameAttributes,
			"challengeNoRatings",
		),
		challengeFiredLuxuryTax: unwrapGameAttribute(
			defaultGameAttributes,
			"challengeFiredLuxuryTax",
		),
		challengeFiredMissPlayoffs: unwrapGameAttribute(
			defaultGameAttributes,
			"challengeFiredMissPlayoffs",
		),
		challengeSisyphusMode: unwrapGameAttribute(
			defaultGameAttributes,
			"challengeSisyphusMode",
		),
		challengeThanosMode: unwrapGameAttribute(
			defaultGameAttributes,
			"challengeThanosMode",
		),
		realPlayerDeterminism: unwrapGameAttribute(
			defaultGameAttributes,
			"realPlayerDeterminism",
		),
		repeatSeason: !!unwrapGameAttribute(defaultGameAttributes, "repeatSeason"),
		ties: unwrapGameAttribute(defaultGameAttributes, "ties"),
		otl: unwrapGameAttribute(defaultGameAttributes, "otl"),
		spectator: unwrapGameAttribute(defaultGameAttributes, "spectator"),
		elam: unwrapGameAttribute(defaultGameAttributes, "elam"),
		elamASG: unwrapGameAttribute(defaultGameAttributes, "elamASG"),
		elamMinutes: unwrapGameAttribute(defaultGameAttributes, "elamMinutes"),
		elamOvertime: unwrapGameAttribute(defaultGameAttributes, "elamOvertime"),
		elamPoints: unwrapGameAttribute(defaultGameAttributes, "elamPoints"),
		playerMoodTraits: unwrapGameAttribute(
			defaultGameAttributes,
			"playerMoodTraits",
		),
		numPlayersOnCourt: unwrapGameAttribute(
			defaultGameAttributes,
			"numPlayersOnCourt",
		),
		numDraftRounds: unwrapGameAttribute(
			defaultGameAttributes,
			"numDraftRounds",
		),
		tradeDeadline: unwrapGameAttribute(defaultGameAttributes, "tradeDeadline"),
		autoDeleteOldBoxScores: unwrapGameAttribute(
			defaultGameAttributes,
			"autoDeleteOldBoxScores",
		),
		difficulty: unwrapGameAttribute(defaultGameAttributes, "difficulty"),
		stopOnInjury: unwrapGameAttribute(defaultGameAttributes, "stopOnInjury"),
		stopOnInjuryGames: unwrapGameAttribute(
			defaultGameAttributes,
			"stopOnInjuryGames",
		),
		aiJerseyRetirement: unwrapGameAttribute(
			defaultGameAttributes,
			"aiJerseyRetirement",
		),
		numPeriods: unwrapGameAttribute(defaultGameAttributes, "numPeriods"),
		tiebreakers: unwrapGameAttribute(defaultGameAttributes, "tiebreakers"),
		pointsFormula: unwrapGameAttribute(defaultGameAttributes, "pointsFormula"),
		equalizeRegions: unwrapGameAttribute(
			defaultGameAttributes,
			"equalizeRegions",
		),
		hideDisabledTeams: unwrapGameAttribute(
			defaultGameAttributes,
			"hideDisabledTeams",
		),
		noStartingInjuries: false,
		randomization: "none",
		realStats: getDefaultRealStats(),
		hofFactor: unwrapGameAttribute(defaultGameAttributes, "hofFactor"),
		injuries: defaultInjuries,
		inflationAvg: unwrapGameAttribute(defaultGameAttributes, "inflationAvg"),
		inflationMax: unwrapGameAttribute(defaultGameAttributes, "inflationMax"),
		inflationMin: unwrapGameAttribute(defaultGameAttributes, "inflationMin"),
		inflationStd: unwrapGameAttribute(defaultGameAttributes, "inflationStd"),
		playoffsByConf: unwrapGameAttribute(
			defaultGameAttributes,
			"playoffsByConf",
		),
		playoffsNumTeamsDiv: unwrapGameAttribute(
			defaultGameAttributes,
			"playoffsNumTeamsDiv",
		),
		playoffsReseed: unwrapGameAttribute(
			defaultGameAttributes,
			"playoffsReseed",
		),
		playerBioInfo: unwrapGameAttribute(defaultGameAttributes, "playerBioInfo"),
		playIn: unwrapGameAttribute(defaultGameAttributes, "playIn"),
		numPlayersDunk: unwrapGameAttribute(
			defaultGameAttributes,
			"numPlayersDunk",
		),
		numPlayersThree: unwrapGameAttribute(
			defaultGameAttributes,
			"numPlayersThree",
		),
		fantasyPoints: unwrapGameAttribute(defaultGameAttributes, "fantasyPoints"),
		tragicDeaths: defaultTragicDeaths,
		goatFormula: goatFormula.DEFAULT_FORMULA,
		goatSeasonFormula: goatFormula.DEFAULT_FORMULA_SEASON,
		draftPickAutoContract: unwrapGameAttribute(
			defaultGameAttributes,
			"draftPickAutoContract",
		),
		draftPickAutoContractPercent: unwrapGameAttribute(
			defaultGameAttributes,
			"draftPickAutoContractPercent",
		),
		draftPickAutoContractRounds: unwrapGameAttribute(
			defaultGameAttributes,
			"draftPickAutoContractRounds",
		),
		dh: unwrapGameAttribute(defaultGameAttributes, "dh"),
		draftLotteryCustomNumPicks: unwrapGameAttribute(
			defaultGameAttributes,
			"draftLotteryCustomNumPicks",
		),
		draftLotteryCustomChances: unwrapGameAttribute(
			defaultGameAttributes,
			"draftLotteryCustomChances",
		),
		passFactor: unwrapGameAttribute(defaultGameAttributes, "passFactor"),
		rushYdsFactor: unwrapGameAttribute(defaultGameAttributes, "rushYdsFactor"),
		passYdsFactor: unwrapGameAttribute(defaultGameAttributes, "passYdsFactor"),
		completionFactor: unwrapGameAttribute(
			defaultGameAttributes,
			"completionFactor",
		),
		scrambleFactor: unwrapGameAttribute(
			defaultGameAttributes,
			"scrambleFactor",
		),
		sackFactor: unwrapGameAttribute(defaultGameAttributes, "sackFactor"),
		fumbleFactor: unwrapGameAttribute(defaultGameAttributes, "fumbleFactor"),
		intFactor: unwrapGameAttribute(defaultGameAttributes, "intFactor"),
		fgAccuracyFactor: unwrapGameAttribute(
			defaultGameAttributes,
			"fgAccuracyFactor",
		),
		fourthDownFactor: unwrapGameAttribute(
			defaultGameAttributes,
			"fourthDownFactor",
		),
		onsideFactor: unwrapGameAttribute(defaultGameAttributes, "onsideFactor"),
		onsideRecoveryFactor: unwrapGameAttribute(
			defaultGameAttributes,
			"onsideRecoveryFactor",
		),
		hitFactor: unwrapGameAttribute(defaultGameAttributes, "hitFactor"),
		giveawayFactor: unwrapGameAttribute(
			defaultGameAttributes,
			"giveawayFactor",
		),
		takeawayFactor: unwrapGameAttribute(
			defaultGameAttributes,
			"takeawayFactor",
		),
		deflectionFactor: unwrapGameAttribute(
			defaultGameAttributes,
			"deflectionFactor",
		),
		saveFactor: unwrapGameAttribute(defaultGameAttributes, "saveFactor"),
		assistFactor: unwrapGameAttribute(defaultGameAttributes, "assistFactor"),
		foulFactor: unwrapGameAttribute(defaultGameAttributes, "foulFactor"),
		groundFactor: unwrapGameAttribute(defaultGameAttributes, "groundFactor"),
		lineFactor: unwrapGameAttribute(defaultGameAttributes, "lineFactor"),
		flyFactor: unwrapGameAttribute(defaultGameAttributes, "flyFactor"),
		powerFactor: unwrapGameAttribute(defaultGameAttributes, "powerFactor"),
		throwOutFactor: unwrapGameAttribute(
			defaultGameAttributes,
			"throwOutFactor",
		),
		strikeFactor: unwrapGameAttribute(defaultGameAttributes, "strikeFactor"),
		balkFactor: unwrapGameAttribute(defaultGameAttributes, "balkFactor"),
		wildPitchFactor: unwrapGameAttribute(
			defaultGameAttributes,
			"wildPitchFactor",
		),
		passedBallFactor: unwrapGameAttribute(
			defaultGameAttributes,
			"passedBallFactor",
		),
		hitByPitchFactor: unwrapGameAttribute(
			defaultGameAttributes,
			"hitByPitchFactor",
		),
		swingFactor: unwrapGameAttribute(defaultGameAttributes, "swingFactor"),
		contactFactor: unwrapGameAttribute(defaultGameAttributes, "contactFactor"),
		softCapTradeSalaryMatch: unwrapGameAttribute(
			defaultGameAttributes,
			"softCapTradeSalaryMatch",
		),
		gender: unwrapGameAttribute(defaultGameAttributes, "gender"),
		heightFactor: unwrapGameAttribute(defaultGameAttributes, "heightFactor"),
		weightFactor: unwrapGameAttribute(defaultGameAttributes, "weightFactor"),
		allStarDunk: unwrapGameAttribute(defaultGameAttributes, "allStarDunk"),
		allStarThree: unwrapGameAttribute(defaultGameAttributes, "allStarThree"),
		minRetireAge: unwrapGameAttribute(defaultGameAttributes, "minRetireAge"),
		numWatchColors: unwrapGameAttribute(
			defaultGameAttributes,
			"numWatchColors",
		),
		giveMeWorstRoster: false,
		groupScheduleSeries: unwrapGameAttribute(
			defaultGameAttributes,
			"groupScheduleSeries",
		),
		/*autoExpandProb: unwrapGameAttribute(
			defaultGameAttributes,
			"autoExpandProb",
		),
		autoExpandNumTeams: unwrapGameAttribute(
			defaultGameAttributes,
			"autoExpandNumTeams",
		),
		autoExpandGeo: unwrapGameAttribute(defaultGameAttributes, "autoExpandGeo"),*/
		autoRelocateProb: unwrapGameAttribute(
			defaultGameAttributes,
			"autoRelocateProb",
		),
		autoRelocateGeo: unwrapGameAttribute(
			defaultGameAttributes,
			"autoRelocateGeo",
		),
		autoRelocateRealign: unwrapGameAttribute(
			defaultGameAttributes,
			"autoRelocateRealign",
		),
		autoRelocateRebrand: unwrapGameAttribute(
			defaultGameAttributes,
			"autoRelocateRebrand",
		),

		// This can be undefined, but if the setting is ever displayed to the user, it should default to "rookie"
		realDraftRatings:
			unwrapGameAttribute(defaultGameAttributes, "realDraftRatings") ??
			"rookie",
	};

	return defaultSettings;
};

export const getRealTeamInfo = async () => {
	const realTeamInfo = (await idb.meta.get("attributes", "realTeamInfo")) as
		| RealTeamInfo
		| undefined;

	return realTeamInfo;
};

const updateNewLeague = async ({ lid, type }: ViewInput<"newLeague">) => {
	const godModeLimits = newLeagueGodModeLimits();

	const overrides = (await idb.meta.get(
		"attributes",
		"defaultSettingsOverrides",
	)) as Settings | undefined;

	const defaultSettings = {
		...getDefaultSettings(),
		...overrides,
	};

	if (lid !== undefined) {
		// Importing!
		const l = await idb.meta.get("leagues", lid);

		if (l) {
			return {
				lid,
				difficulty: l.difficulty,
				name: l.name,
				type,
				godModeLimits,
				defaultSettings,
			};
		}
	}

	// Find most recent league and add one to the LID
	const newLid = await getNewLeagueLid();

	return {
		lid: undefined,
		difficulty: defaultSettings.difficulty,
		name: `League ${newLid}`,
		realTeamInfo: await getRealTeamInfo(),
		type,
		godModeLimits,
		defaultSettings,
	};
};

export default updateNewLeague;
