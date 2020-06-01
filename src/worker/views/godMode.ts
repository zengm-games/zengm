import { g } from "../util";
import type { UpdateEvents } from "../../common/types";

const updateGodMode = async (inputs: unknown, updateEvents: UpdateEvents) => {
	if (
		updateEvents.includes("firstRun") ||
		updateEvents.includes("gameAttributes")
	) {
		return {
			godMode: g.get("godMode"),
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
			aiTradesFactor: g.get("aiTradesFactor"),
			injuryRate: g.get("injuryRate"),
			homeCourtAdvantage: g.get("homeCourtAdvantage"),
			rookieContractLengths: g.get("rookieContractLengths"),
			tragicDeathRate: g.get("tragicDeathRate"),
			brotherRate: g.get("brotherRate"),
			sonRate: g.get("sonRate"),
			hardCap: g.get("hardCap"),
			numGamesPlayoffSeries: g.get("numGamesPlayoffSeries", Infinity), // Always get latest value
			numPlayoffByes: g.get("numPlayoffByes"),
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
		};
	}
};

export default updateGodMode;
