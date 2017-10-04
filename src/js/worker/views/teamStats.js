// @flow

import { g } from "../../common";
import { idb } from "../db";
import type { UpdateEvents } from "../../common/types";

async function updateTeams(
    inputs: {
        playoffs: "playoffs" | "regularSeason",
        season: number,
        teamOpponent: "advanced" | "opponent" | "team",
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
                "oppFg",
                "oppFga",
                "oppFgp",
                "oppTp",
                "oppTpa",
                "oppTpp",
                "oppFt",
                "oppFta",
                "oppFtp",
                "oppOrb",
                "oppDrb",
                "oppTrb",
                "oppAst",
                "oppTov",
                "oppStl",
                "oppBlk",
                "oppPf",
                "oppPts",
                "oppDiff",
                "pw",
                "pl",
            ],
            season: inputs.season,
            playoffs: inputs.playoffs === "playoffs",
            regularSeason: inputs.playoffs !== "playoffs",
        })).filter(t => {
            // For playoffs, only show teams who actually made playoffs (gp > 0)
            return inputs.playoffs !== "playoffs" || t.stats.gp > 0;
        });

        // For playoffs, fix W/L to be playoff W/L not regular season
        if (inputs.playoffs === "playoffs") {
            const playoffSeries = await idb.getCopy.playoffSeries({
                season: inputs.season,
            });
            if (playoffSeries !== undefined) {
                // Reset W/L
                for (const t of teams) {
                    t.seasonAttrs.won = 0;
                    t.seasonAttrs.lost = 0;
                }

                console.log("playoffSeries", playoffSeries);
                for (const round of playoffSeries.series) {
                    for (const series of round) {
                        for (const ah of ["away", "home"]) {
                            const ha = ah === "away" ? "home" : "away";
                            const t = teams.find(
                                t2 => t2.tid === series[ah].tid,
                            );
                            if (t) {
                                t.seasonAttrs.won += series[ah].won;
                                t.seasonAttrs.lost += series[ha].won;
                            }
                        }
                    }
                }
            }
        }

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
            "oppFg",
            "oppFga",
            "oppFgp",
            "oppTp",
            "oppTpa",
            "oppTpp",
            "oppFt",
            "oppFta",
            "oppFtp",
            "oppOrb",
            "oppDrb",
            "oppTrb",
            "oppAst",
            "oppTov",
            "oppStl",
            "oppBlk",
            "oppPf",
            "oppPts",
            "oppDiff",
            "pw",
            "pl",
        ];
        const lowerIsBetter = [
            "lost",
            "tov",
            "pf",
            "oppFg",
            "oppFga",
            "oppFgp",
            "oppTp",
            "oppTpa",
            "oppTpp",
            "oppFt",
            "oppFta",
            "oppFtp",
            "oppOrb",
            "oppDrb",
            "oppTrb",
            "oppAst",
            "oppStl",
            "oppBlk",
            "oppPts",
            "oppDiff",
            "pl",
        ];

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
