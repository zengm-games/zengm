// @flow

import { PHASE, PLAYER } from "../../common";
import { idb } from "../db";
import { g } from "../util";
import type { PlayerStatType, UpdateEvents } from "../../common/types";

async function updatePlayers(
    inputs: {
        abbrev: string,
        playoffs: "playoffs" | "regularSeason",
        season: number,
        statType: "advanced" | PlayerStatType,
    },
    updateEvents: UpdateEvents,
    state: any,
): void | { [key: string]: any } {
    if (
        (inputs.season === g.season &&
            (updateEvents.includes("gameSim") ||
                updateEvents.includes("playerMovement"))) ||
        inputs.abbrev !== state.abbrev ||
        inputs.season !== state.season ||
        inputs.statType !== state.statType ||
        inputs.playoffs !== state.playoffs
    ) {
        let stats;
        if (process.env.SPORT === "basketball") {
            stats =
                inputs.statType !== "advanced"
                    ? [
                          "gp",
                          "gs",
                          "min",
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
                          "ba",
                          "pf",
                          "pts",
                      ]
                    : [
                          "gp",
                          "gs",
                          "min",
                          "per",
                          "ewa",
                          "ortg",
                          "drtg",
                          "ows",
                          "dws",
                          "ws",
                          "ws48",
                          "tsp",
                          "tpar",
                          "ftr",
                          "orbp",
                          "drbp",
                          "trbp",
                          "astp",
                          "stlp",
                          "blkp",
                          "tovp",
                          "usgp",
                          "pm",
                      ];
        } else {
            stats = [
                "gp",
                "gs",
                "fmb",
                "fmbLost",
                "pssCmp",
                "pss",
                "pssYds",
                "pssTD",
                "pssInt",
                "pssLng",
                "pssSk",
                "pssSkYds",
                "rus",
                "rusYds",
                "rusTD",
                "rusLng",
                "tgt",
                "rec",
                "recYds",
                "recTD",
                "recLng",
                "pr",
                "prYds",
                "prTD",
                "prLng",
                "kr",
                "krYds",
                "krTD",
                "krLng",
                "defInt",
                "defIntYds",
                "defIntTD",
                "defIntLng",
                "defPssDef",
                "defFmbFrc",
                "defFmbRec",
                "defFmbYds",
                "defFmbTD",
                "defSk",
                "defTckSolo",
                "defTckAst",
                "defTckLoss",
                "defSft",
                "fg0",
                "fga0",
                "fg20",
                "fga20",
                "fg30",
                "fga30",
                "fg40",
                "fga40",
                "fg50",
                "fga50",
                "fgLng",
                "xp",
                "xpa",
                "pnt",
                "pntYds",
                "pntLng",
                "pntBlk",
                "pen",
                "penYds",
            ];
        }

        let players;
        if (g.season === inputs.season && g.phase <= PHASE.PLAYOFFS) {
            players = await idb.cache.players.indexGetAll("playersByTid", [
                PLAYER.FREE_AGENT,
                Infinity,
            ]);
        } else {
            players = await idb.getCopies.players({
                activeSeason: inputs.season,
            });
        }

        let tid = g.teamAbbrevsCache.indexOf(inputs.abbrev);
        if (tid < 0) {
            tid = undefined;
        } // Show all teams

        if (!tid && inputs.abbrev === "watch") {
            players = players.filter(
                p => p.watch && typeof p.watch !== "function",
            );
        }

        players = await idb.getCopies.playersPlus(players, {
            attrs: [
                "pid",
                "nameAbbrev",
                "age",
                "injury",
                "tid",
                "abbrev",
                "hof",
                "watch",
            ],
            ratings: ["skills", "pos"],
            stats: ["abbrev", "tid", ...stats],
            season: inputs.season, // If null, then show career stats!
            tid,
            statType:
                inputs.statType === "advanced" ? "perGame" : inputs.statType,
            playoffs: inputs.playoffs === "playoffs",
            regularSeason: inputs.playoffs !== "playoffs",
        });

        // Find max gp to use for filtering
        let gp = 0;
        for (const p of players) {
            if (p.stats.gp > gp) {
                gp = p.stats.gp;
            }
        }
        // Special case for career totals - use g.numGames games, unless this is the first season
        if (!inputs.season) {
            if (g.season > g.startingSeason) {
                gp = g.numGames;
            }
        }

        // Only keep players with more than 5 mpg in regular season, of any PT in playoffs
        if (inputs.abbrev !== "watch") {
            players = players.filter(p => {
                // Minutes played
                let min;
                if (inputs.statType === "totals") {
                    if (inputs.season) {
                        min = p.stats.min;
                    } else if (inputs.playoffs !== "playoffs") {
                        min = p.careerStats.min;
                    }
                } else if (inputs.season) {
                    min = p.stats.gp * p.stats.min;
                } else if (inputs.playoffs !== "playoffs") {
                    min = p.careerStats.gp * p.careerStats.min;
                }

                if (inputs.playoffs !== "playoffs") {
                    if (min !== undefined && min > gp * 5) {
                        return true;
                    }
                }

                // Or, keep players who played in playoffs
                if (inputs.playoffs === "playoffs") {
                    if (inputs.season) {
                        if (p.stats.gp > 0) {
                            return true;
                        }
                    } else if (p.careerStatsPlayoffs.gp > 0) {
                        return true;
                    }
                }

                return false;
            });
        }

        return {
            players,
            abbrev: inputs.abbrev,
            season: inputs.season,
            statType: inputs.statType,
            playoffs: inputs.playoffs,
            stats,
            userTid: g.userTid,
        };
    }
}

export default {
    runBefore: [updatePlayers],
};
