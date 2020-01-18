import { g } from "../util";
import { UpdateEvents } from "../../common/types";

const updateGodMode = async (inputs: unknown, updateEvents: UpdateEvents) => {
	if (
		updateEvents.includes("firstRun") ||
		updateEvents.includes("gameAttributes")
	) {
		return {
			godMode: g.get("godMode"),
			numGames: g.get("numGames"),
			numTeams: g.get("numTeams"),
			quarterLength: g.get("quarterLength"),
			maxRosterSize: g.get("maxRosterSize"),
			minRosterSize: g.get("minRosterSize"),
			salaryCap: g.get("salaryCap"),
			minPayroll: g.get("minPayroll"),
			luxuryPayroll: g.get("luxuryPayroll"),
			luxuryTax: g.get("luxuryTax"),
			minContract: g.get("minContract"),
			maxContract: g.get("maxContract"),
			aiTrades: g.get("aiTrades"),
			injuryRate: g.get("injuryRate"),
			homeCourtAdvantage: g.get("homeCourtAdvantage"),
			tragicDeathRate: g.get("tragicDeathRate"),
			brotherRate: g.get("brotherRate"),
			sonRate: g.get("sonRate"),
			hardCap: g.get("hardCap"),
			numGamesPlayoffSeries: g.get("numGamesPlayoffSeries"),
			numPlayoffByes: g.get("numPlayoffByes"),
			draftType: g.get("draftType"),
			playersRefuseToNegotiate: g.get("playersRefuseToNegotiate"),
			allStarGame: g.get("allStarGame"),
			budget: g.get("budget"),
			numSeasonsFutureDraftPicks: g.get("numSeasonsFutureDraftPicks"),
			foulRateFactor: g.get("foulRateFactor"),
			foulsNeededToFoulOut: g.get("foulsNeededToFoulOut"),
		};
	}
};

export default updateGodMode;
