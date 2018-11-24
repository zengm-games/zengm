// @flow

import { g } from "../util";
import type { GetOutput, UpdateEvents } from "../../common/types";

async function updateExportStats(
    inputs: GetOutput,
    updateEvents: UpdateEvents,
): void | { [key: string]: any } {
    if (
        updateEvents.includes("firstRun") ||
        updateEvents.includes("newPhase")
    ) {
        const options = [
            {
                key: "all",
                val: "All Seasons",
            },
        ];
        for (let season = g.startingSeason; season <= g.season; season++) {
            options.push({
                key: String(season),
                val: `${season} season`,
            });
        }
        return {
            seasons: options,
        };
    }
}

export default {
    runBefore: [updateExportStats],
};
