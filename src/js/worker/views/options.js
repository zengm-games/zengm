// @flow

import { g } from "../util";
import type { GetOutput, UpdateEvents } from "../../common/types";

async function updateOptions(
    inputs: GetOutput,
    updateEvents: UpdateEvents,
): void | { [key: string]: any } {
    if (updateEvents.includes("firstRun")) {
        return {
            autoDeleteOldBoxScores: g.autoDeleteOldBoxScores,
            stopOnInjury: g.stopOnInjury,
            stopOnInjuryGames: g.stopOnInjuryGames,
        };
    }
}

export default {
    runBefore: [updateOptions],
};
