// @flow

import { g } from "../util";
import type { GetOutput, UpdateEvents } from "../../common/types";

async function updateGodMode(
    inputs: GetOutput,
    updateEvents: UpdateEvents,
): void | { [key: string]: any } {
    if (
        updateEvents.includes("firstRun") ||
        updateEvents.includes("gameAttributes")
    ) {
        return {
            godMode: g.godMode,
            disableInjuries: g.disableInjuries,
            numGames: g.numGames,
            numTeams: g.numTeams,
            quarterLength: g.quarterLength,
            maxRosterSize: g.maxRosterSize,
            minRosterSize: g.minRosterSize,
            salaryCap: g.salaryCap / 1000,
            minPayroll: g.minPayroll / 1000,
            luxuryPayroll: g.luxuryPayroll / 1000,
            luxuryTax: g.luxuryTax,
            minContract: g.minContract / 1000,
            maxContract: g.maxContract / 1000,
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
        };
    }
}

export default {
    runBefore: [updateGodMode],
};
