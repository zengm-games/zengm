// @flow

import { g } from "../util";
import type { GetOutput, UpdateEvents } from "../../common/types";

async function updateMultiTeamMode(
    inputs: GetOutput,
    updateEvents: UpdateEvents,
): void | { [key: string]: any } {
    if (
        updateEvents.includes("firstRun") ||
        updateEvents.includes("g.userTids") ||
        updateEvents.includes("newPhase")
    ) {
        const teams = [];
        for (let i = 0; i < g.numTeams; i++) {
            teams.push({
                tid: i,
                name: `${g.teamRegionsCache[i]} ${g.teamNamesCache[i]}`,
            });
        }

        return {
            phase: g.phase,
            teams,
            userTid: g.userTid,
            userTids: g.userTids,
        };
    }
}

export default {
    runBefore: [updateMultiTeamMode],
};
