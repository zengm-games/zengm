import { g } from "../util";
import type { UpdateEvents } from "../../common/types";

const updateSettings = async (inputs: unknown, updateEvents: UpdateEvents) => {
	if (
		updateEvents.includes("firstRun") ||
		updateEvents.includes("gameAttributes")
	) {
		return {
			godMode: g.get("godMode"),
			godModeInPast: g.get("godModeInPast"),
			numGames: g.get("numGames"),
			numActiveTeams: g.get("numActiveTeams"),
			quarterLength: g.get("quarterLength"),
			maxRosterSize: g.get("maxRosterSize"),
			minRosterSize: g.get("minRosterSize"),
			salaryCap: g.get("salaryCap"),
			minPayroll: g.get("minPayroll"),
			luxuryPayroll: g.get("luxuryPayroll"),
			luxuryTax: g.get("luxuryTax"),
			minContract: g.get("minContract"),
			maxContract: g.get("maxContract"),
			minContractLength: g.get("minContractLength"),
			maxContractLength: g.get("maxContractLength"),
			aiTradesFactor: g.get("aiTradesFactor"),
			injuryRate: g.get("injuryRate"),
			homeCourtAdvantage: g.get("homeCourtAdvantage"),
			rookieContractLengths: g.get("rookieContractLengths"),
			rookiesCanRefuse: g.get("rookiesCanRefuse"),
			tragicDeathRate: g.get("tragicDeathRate"),
			brotherRate: g.get("brotherRate"),
			sonRate: g.get("sonRate"),
			hardCap: g.get("hardCap"),
			numGamesPlayoffSeries: g.get("numGamesPlayoffSeries"), // Always get latest value
			numPlayoffByes: g.get("numPlayoffByes"), // Always get latest value
			draftType: g.get("draftType"),
			playersRefuseToNegotiate: g.get("playersRefuseToNegotiate"),
			allStarGame: g.get("allStarGame"),
			budget: g.get("budget"),
			numSeasonsFutureDraftPicks: g.get("numSeasonsFutureDraftPicks"),
			foulRateFactor: g.get("foulRateFactor"),
			foulsNeededToFoulOut: g.get("foulsNeededToFoulOut"),
			threePointers: g.get("threePointers"),
			pace: g.get("pace"),
			threePointTendencyFactor: g.get("threePointTendencyFactor"),
			threePointAccuracyFactor: g.get("threePointAccuracyFactor"),
			twoPointAccuracyFactor: g.get("twoPointAccuracyFactor"),
			challengeNoDraftPicks: g.get("challengeNoDraftPicks"),
			challengeNoFreeAgents: g.get("challengeNoFreeAgents"),
			challengeNoTrades: g.get("challengeNoTrades"),
			challengeLoseBestPlayer: g.get("challengeLoseBestPlayer"),
			challengeNoRatings: g.get("challengeNoRatings"),
			challengeFiredLuxuryTax: g.get("challengeFiredLuxuryTax"),
			challengeFiredMissPlayoffs: g.get("challengeFiredMissPlayoffs"),
			realPlayerDeterminism: g.get("realPlayerDeterminism"),
			repeatSeason: !!g.get("repeatSeason"),
			ties: g.get("ties"),
			spectator: g.get("spectator"),
			elam: g.get("elam"),
			elamASG: g.get("elamASG"),
			elamMinutes: g.get("elamMinutes"),
			elamPoints: g.get("elamPoints"),
			playerMoodTraits: g.get("playerMoodTraits"),
			numPlayersOnCourt: g.get("numPlayersOnCourt"),
			numDraftRounds: g.get("numDraftRounds"),
			tradeDeadline: g.get("tradeDeadline"),
			autoDeleteOldBoxScores: g.get("autoDeleteOldBoxScores"),
			difficulty: g.get("difficulty"),
			stopOnInjury: g.get("stopOnInjury"),
			stopOnInjuryGames: g.get("stopOnInjuryGames"),
			aiJerseyRetirement: g.get("aiJerseyRetirement"),
		};
	}
};

export default updateSettings;
