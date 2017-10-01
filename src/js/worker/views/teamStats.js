// @flow

import { g } from "../../common";
import { idb } from "../db";
import type { UpdateEvents } from "../../common/types";

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
        const teams = await idb.getCopies.teamsPlus({
            attrs: ["tid", "abbrev"],
            seasonAttrs: ["won", "lost"],
            stats: [
                "gp",
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
                "diff",
            ],
            season: inputs.season,
            playoffs: inputs.playoffs === "playoffs",
            regularSeason: inputs.playoffs !== "playoffs",
        });

        // Sort stats so we can determine what percentile our team is in.
        const stats = {};
        const statTypes = [
            "won",
            "lost",
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
            "diff",
        ];
        const lowerIsBetter = ["lost", "tov", "oppBlk", "pf", "oppPts"];

        // Loop teams and stat types.
        for (const t of teams) {
            for (const statType of statTypes) {
                const value = t.stats.hasOwnProperty(statType)
                    ? t.stats[statType]
                    : t.seasonAttrs[statType];

                if (!stats[statType]) {
                    stats[statType] = [value];
                } else {
                    stats[statType].push(value);
                }
            }
        }

        // Sort stat types. "Better" values are at the start of the arrays.
        for (const statType of Object.keys(stats)) {
            stats[statType].sort((a, b) => {
                // Sort lowest first.
                if (lowerIsBetter.includes(statType)) {
                    if (a < b) {
                        return -1;
                    } else if (a > b) {
                        return 1;
                    }

                    return 0;
                }

                // Sort highest first.
                if (a < b) {
                    return 1;
                } else if (a > b) {
                    return -1;
                }

                return 0;
            });
        }

        return {
            playoffs: inputs.playoffs,
            season: inputs.season,
            stats,
            teamOpponent: inputs.teamOpponent,
            teams,
        };
    }
}

export default {
    runBefore: [updateTeams],
};
