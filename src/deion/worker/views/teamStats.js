// @flow

import { idb } from "../db";
import { g, overrides } from "../util";
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
        const statsTable =
            overrides.common.constants.TEAM_STATS_TABLES[inputs.teamOpponent];
        if (!statsTable) {
            throw new Error(`Invalid statType: "${inputs.teamOpponent}"`);
        }
        const stats = statsTable.stats;

        const seasonAttrs = g.ties ? ["won", "lost", "tied"] : ["won", "lost"];

        const teams = (await idb.getCopies.teamsPlus({
            attrs: ["tid", "abbrev"],
            seasonAttrs,
            stats: ["gp", ...stats],
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

                for (const round of playoffSeries.series) {
                    for (const series of round) {
                        for (const ah of ["away", "home"]) {
                            const ha = ah === "away" ? "home" : "away";
                            const t = teams.find(
                                t2 => series[ah] && t2.tid === series[ah].tid,
                            );
                            if (t && series[ah] && series[ha]) {
                                t.seasonAttrs.won += series[ah].won;
                                t.seasonAttrs.lost += series[ha].won;
                            }
                        }
                    }
                }
            }
        }

        // Sort stats so we can determine what percentile our team is in.
        const allStats = {};
        let statTypes = seasonAttrs.slice();
        for (const table of Object.values(
            overrides.common.constants.TEAM_STATS_TABLES,
        )) {
            // $FlowFixMe
            statTypes = statTypes.concat(table.stats);
        }
        const lowerIsBetter =
            process.env.SPORT === "basketball"
                ? [
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
                      "oppMov",
                      "pl",
                      "drtg",
                  ]
                : [
                      "lost",
                      "tov",
                      "fmbLost",
                      "pssInt",
                      "pen",
                      "penYds",
                      "drivesTurnoverPct",
                      "oppPts",
                      "oppYds",
                      "oppPly",
                      "oppYdsPerPlay",
                      "oppPssCmp",
                      "oppPss",
                      "oppPssYds",
                      "oppPssTD",
                      "oppPssNetYdsPerAtt",
                      "oppRus",
                      "oppRusYds",
                      "oppRusTD",
                      "oppRusYdsPerAtt",
                      "oppDrives",
                      "oppDrivesScoringPct",
                      "oppAvgFieldPosition",
                      "oppTimePerDrive",
                      "oppPlaysPerDrive",
                      "oppYdsPerDrive",
                      "oppPtsPerDrive",
                  ];

        // Loop teams and stat types.
        for (const t of teams) {
            for (const statType of statTypes) {
                const value = t.stats.hasOwnProperty(statType)
                    ? t.stats[statType]
                    : t.seasonAttrs[statType];

                if (value === undefined) {
                    continue;
                }

                if (!allStats[statType]) {
                    allStats[statType] = [value];
                } else {
                    allStats[statType].push(value);
                }
            }
        }

        // Sort stat types. "Better" values are at the start of the arrays.
        for (const statType of Object.keys(allStats)) {
            allStats[statType].sort((a, b) => {
                // Sort lowest first.
                if (lowerIsBetter.includes(statType)) {
                    if (a < b) {
                        return -1;
                    }
                    if (a > b) {
                        return 1;
                    }

                    return 0;
                }

                // Sort highest first.
                if (a < b) {
                    return 1;
                }
                if (a > b) {
                    return -1;
                }

                return 0;
            });
        }

        return {
            allStats,
            playoffs: inputs.playoffs,
            season: inputs.season,
            stats,
            teamOpponent: inputs.teamOpponent,
            teams,
            ties: g.ties,
            userTid: g.userTid,
        };
    }
}

export default {
    runBefore: [updateTeams],
};
