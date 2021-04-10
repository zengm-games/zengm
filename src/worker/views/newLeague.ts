import { idb } from "../db";
import type { ViewInput, RealTeamInfo } from "../../common/types";
import {
	defaultGameAttributes,
	getNewLeagueLid,
	newLeagueGodModeLimits,
} from "../util";
import type { Settings } from "./settings";
import { unwrap } from "../util/g";

const updateNewLeague = async ({ lid, type }: ViewInput<"newLeague">) => {
	const godModeLimits = newLeagueGodModeLimits();

	const defaultSettings: Settings = {
		godMode: unwrap(defaultGameAttributes, "godMode"),
		godModeInPast: unwrap(defaultGameAttributes, "godModeInPast"),
		numGames: unwrap(defaultGameAttributes, "numGames"),
		numActiveTeams: unwrap(defaultGameAttributes, "numActiveTeams"),
		quarterLength: unwrap(defaultGameAttributes, "quarterLength"),
		maxRosterSize: unwrap(defaultGameAttributes, "maxRosterSize"),
		minRosterSize: unwrap(defaultGameAttributes, "minRosterSize"),
		salaryCap: unwrap(defaultGameAttributes, "salaryCap"),
		minPayroll: unwrap(defaultGameAttributes, "minPayroll"),
		luxuryPayroll: unwrap(defaultGameAttributes, "luxuryPayroll"),
		luxuryTax: unwrap(defaultGameAttributes, "luxuryTax"),
		minContract: unwrap(defaultGameAttributes, "minContract"),
		maxContract: unwrap(defaultGameAttributes, "maxContract"),
		minContractLength: unwrap(defaultGameAttributes, "minContractLength"),
		maxContractLength: unwrap(defaultGameAttributes, "maxContractLength"),
		aiTradesFactor: unwrap(defaultGameAttributes, "aiTradesFactor"),
		injuryRate: unwrap(defaultGameAttributes, "injuryRate"),
		homeCourtAdvantage: unwrap(defaultGameAttributes, "homeCourtAdvantage"),
		rookieContractLengths: unwrap(
			defaultGameAttributes,
			"rookieContractLengths",
		),
		rookiesCanRefuse: unwrap(defaultGameAttributes, "rookiesCanRefuse"),
		tragicDeathRate: unwrap(defaultGameAttributes, "tragicDeathRate"),
		brotherRate: unwrap(defaultGameAttributes, "brotherRate"),
		sonRate: unwrap(defaultGameAttributes, "sonRate"),
		forceRetireAge: unwrap(defaultGameAttributes, "forceRetireAge"),
		hardCap: unwrap(defaultGameAttributes, "hardCap"),
		numGamesPlayoffSeries: unwrap(
			defaultGameAttributes,
			"numGamesPlayoffSeries",
		),
		numPlayoffByes: unwrap(defaultGameAttributes, "numPlayoffByes"),
		draftType: unwrap(defaultGameAttributes, "draftType"),
		draftAges: unwrap(defaultGameAttributes, "draftAges"),
		playersRefuseToNegotiate: unwrap(
			defaultGameAttributes,
			"playersRefuseToNegotiate",
		),
		allStarGame: unwrap(defaultGameAttributes, "allStarGame"),
		budget: unwrap(defaultGameAttributes, "budget"),
		numSeasonsFutureDraftPicks: unwrap(
			defaultGameAttributes,
			"numSeasonsFutureDraftPicks",
		),
		foulRateFactor: unwrap(defaultGameAttributes, "foulRateFactor"),
		foulsNeededToFoulOut: unwrap(defaultGameAttributes, "foulsNeededToFoulOut"),
		foulsUntilBonus: unwrap(defaultGameAttributes, "foulsUntilBonus"),
		threePointers: unwrap(defaultGameAttributes, "threePointers"),
		pace: unwrap(defaultGameAttributes, "pace"),
		threePointTendencyFactor: unwrap(
			defaultGameAttributes,
			"threePointTendencyFactor",
		),
		threePointAccuracyFactor: unwrap(
			defaultGameAttributes,
			"threePointAccuracyFactor",
		),
		twoPointAccuracyFactor: unwrap(
			defaultGameAttributes,
			"twoPointAccuracyFactor",
		),
		blockFactor: unwrap(defaultGameAttributes, "blockFactor"),
		stealFactor: unwrap(defaultGameAttributes, "stealFactor"),
		turnoverFactor: unwrap(defaultGameAttributes, "turnoverFactor"),
		orbFactor: unwrap(defaultGameAttributes, "orbFactor"),
		challengeNoDraftPicks: unwrap(
			defaultGameAttributes,
			"challengeNoDraftPicks",
		),
		challengeNoFreeAgents: unwrap(
			defaultGameAttributes,
			"challengeNoFreeAgents",
		),
		challengeNoTrades: unwrap(defaultGameAttributes, "challengeNoTrades"),
		challengeLoseBestPlayer: unwrap(
			defaultGameAttributes,
			"challengeLoseBestPlayer",
		),
		challengeNoRatings: unwrap(defaultGameAttributes, "challengeNoRatings"),
		challengeFiredLuxuryTax: unwrap(
			defaultGameAttributes,
			"challengeFiredLuxuryTax",
		),
		challengeFiredMissPlayoffs: unwrap(
			defaultGameAttributes,
			"challengeFiredMissPlayoffs",
		),
		challengeThanosMode: unwrap(defaultGameAttributes, "challengeThanosMode"),
		realPlayerDeterminism: unwrap(
			defaultGameAttributes,
			"realPlayerDeterminism",
		),
		repeatSeason: !!unwrap(defaultGameAttributes, "repeatSeason"),
		ties: unwrap(defaultGameAttributes, "ties"),
		otl: unwrap(defaultGameAttributes, "otl"),
		spectator: unwrap(defaultGameAttributes, "spectator"),
		elam: unwrap(defaultGameAttributes, "elam"),
		elamASG: unwrap(defaultGameAttributes, "elamASG"),
		elamMinutes: unwrap(defaultGameAttributes, "elamMinutes"),
		elamPoints: unwrap(defaultGameAttributes, "elamPoints"),
		playerMoodTraits: unwrap(defaultGameAttributes, "playerMoodTraits"),
		numPlayersOnCourt: unwrap(defaultGameAttributes, "numPlayersOnCourt"),
		numDraftRounds: unwrap(defaultGameAttributes, "numDraftRounds"),
		tradeDeadline: unwrap(defaultGameAttributes, "tradeDeadline"),
		autoDeleteOldBoxScores: unwrap(
			defaultGameAttributes,
			"autoDeleteOldBoxScores",
		),
		difficulty: unwrap(defaultGameAttributes, "difficulty"),
		stopOnInjury: unwrap(defaultGameAttributes, "stopOnInjury"),
		stopOnInjuryGames: unwrap(defaultGameAttributes, "stopOnInjuryGames"),
		aiJerseyRetirement: unwrap(defaultGameAttributes, "aiJerseyRetirement"),
		numPeriods: unwrap(defaultGameAttributes, "numPeriods"),
		tiebreakers: unwrap(defaultGameAttributes, "tiebreakers"),
		pointsFormula: unwrap(defaultGameAttributes, "pointsFormula"),
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
