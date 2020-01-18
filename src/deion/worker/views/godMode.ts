import { g } from "../util";
import { UpdateEvents } from "../../common/types";

const updateGodMode = async (inputs: unknown, updateEvents: UpdateEvents) => {
	if (
		updateEvents.includes("firstRun") ||
		updateEvents.includes("gameAttributes")
	) {
		return {
			godMode: g.godMode,
			numGames: g.numGames,
			numTeams: g.numTeams,
			quarterLength: g.quarterLength,
			maxRosterSize: g.maxRosterSize,
			minRosterSize: g.minRosterSize,
			salaryCap: g.salaryCap,
			minPayroll: g.minPayroll,
			luxuryPayroll: g.luxuryPayroll,
			luxuryTax: g.luxuryTax,
			minContract: g.minContract,
			maxContract: g.maxContract,
			aiTrades: g.aiTrades,
			injuryRate: g.injuryRate,
			homeCourtAdvantage: g.homeCourtAdvantage,
			tragicDeathRate: g.tragicDeathRate,
			brotherRate: g.brotherRate,
			sonRate: g.sonRate,
			hardCap: g.hardCap,
			numGamesPlayoffSeries: g.numGamesPlayoffSeries,
			numPlayoffByes: g.numPlayoffByes,
			draftType: g.draftType,
			playersRefuseToNegotiate: g.playersRefuseToNegotiate,
			allStarGame: g.allStarGame,
			budget: g.budget,
			numSeasonsFutureDraftPicks: g.numSeasonsFutureDraftPicks,
			foulRateFactor: g.foulRateFactor,
			foulsNeededToFoulOut: g.foulsNeededToFoulOut,
		};
	}
};

export default updateGodMode;
