// @flow

import { idb } from "../db";
import { g } from "../util";
import type { UpdateEvents } from "../../common/types";

async function updateTeams(
    inputs: { season: number },
    updateEvents: UpdateEvents,
    state: any,
): void | { [key: string]: any } {
    if (
        (inputs.season === g.season &&
            (updateEvents.includes("gameSim") ||
                updateEvents.includes("playerMovement"))) ||
        inputs.season !== state.season
    ) {
        const teams = await idb.getCopies.teamsPlus({
            seasonAttrs: ["won", "lost"],
            stats: [
                "fg",
                "fga",
                "fgp",
                "tp",
                "tpa",
                "tpp",
                "ft",
                "fta",
                "ftp",
                "orb",
                "drb",
                "trb",
                "ast",
                "tov",
                "stl",
                "blk",
                "pf",
                "pts",
                "oppPts",
            ],
            season: inputs.season,
        });

        const statsAll = teams.reduce((memo, t) => {
            for (const cat of ["seasonAttrs", "stats"]) {
                for (const stat of Object.keys(t[cat])) {
                    if (memo.hasOwnProperty(stat)) {
                        memo[stat].push(t[cat][stat]);
                    } else {
                        memo[stat] = [t[cat][stat]];
                    }
                }
            }
            return memo;
        }, {});

        return {
            season: inputs.season,
            statsAll,
        };
    }
}

export default {
    runBefore: [updateTeams],
};
