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

		// This can be undefined, but if the setting is ever displayed to the user, it should default to "rookie"
		realDraftRatings:
			unwrapGameAttribute(defaultGameAttributes, "realDraftRatings") ??
			"rookie",
	};

	return defaultSettings;
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

	const realTeamInfo = (await idb.meta.get("attributes", "realTeamInfo")) as
		| RealTeamInfo
		| undefined;

	return {
		lid: undefined,
		difficulty: undefined,
		name: `League ${newLid}`,
		realTeamInfo,
		type,
		godModeLimits,
		defaultSettings,
	};
};

export default updateNewLeague;
