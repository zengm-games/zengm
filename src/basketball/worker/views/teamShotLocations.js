// @flow

import { idb } from "../../../deion/worker/db";
import { g } from "../../../deion/worker/util";
import type { UpdateEvents } from "../../../deion/common/types";

async function updateTeams(
    inputs: {
        playoffs: "playoffs" | "regularSeason",
        season: number,
        teamOpponent: "opponent" | "team",
    },
    updateEvents: UpdateEvents,
    state: any,
): void | { [key: string]: any } {
    if (
        (inputs.season === g.season &&
            (updateEvents.includes("gameSim") ||
                updateEvents.includes("playerMovement"))) ||
        inputs.playoffs !== state.playoffs ||
        inputs.season !== state.season ||
        inputs.teamOpponent !== state.teamOpponent
    ) {
        const teams = (await idb.getCopies.teamsPlus({
            attrs: ["abbrev", "tid"],
            seasonAttrs: ["won", "lost"],
            stats: [
                "gp",
                "fgAtRim",
                "fgaAtRim",
                "fgpAtRim",
                "fgLowPost",
                "fgaLowPost",
                "fgpLowPost",
                "fgMidRange",
                "fgaMidRange",
                "fgpMidRange",
                "tp",
                "tpa",
                "tpp",
                "oppFgAtRim",
                "oppFgaAtRim",
                "oppFgpAtRim",
                "oppFgLowPost",
                "oppFgaLowPost",
                "oppFgpLowPost",
                "oppFgMidRange",
                "oppFgaMidRange",
                "oppFgpMidRange",
                "oppTp",
                "oppTpa",
                "oppTpp",
            ],
            season: inputs.season,
            playoffs: inputs.playoffs === "playoffs",
            regularSeason: inputs.playoffs !== "playoffs",
        })).filter(t => {
            // For playoffs, only show teams who actually made playoffs (gp > 0)
            return inputs.playoffs !== "playoffs" || t.stats.gp > 0;
        });

        return {
            playoffs: inputs.playoffs,
            season: inputs.season,
            teamOpponent: inputs.teamOpponent,
            teams,
            userTid: g.userTid,
        };
    }
}

export default {
    runBefore: [updateTeams],
};
