// @flow

import { PLAYER } from "../../common";
import { freeAgents } from "../core";
import { idb } from "../db";
import { g, helpers, overrides } from "../util";
import type { UpdateEvents } from "../../common/types";

async function updatePlayer(
    inputs: { pid: number },
    updateEvents: UpdateEvents,
    state: any,
): void | { [key: string]: any } {
    if (
        updateEvents.includes("firstRun") ||
        !state.retired ||
        state.pid !== inputs.pid
    ) {
        const ratings = overrides.constants.RATINGS;

        const statTables =
            process.env.SPORT === "basketball"
                ? [
                      {
                          name: "Stats",
                          stats: [
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
                          ],
                      },
                      {
                          name: "Advanced",
                          stats: [
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
                          ],
                      },
                  ]
                : [
                      {
                          name: "Passing",
                          stats: [
                              "gp",
                              "gs",
                              "pssCmp",
                              "pss",
                              "pssYds",
                              "pssTD",
                              "pssInt",
                              "pssLng",
                              "pssSk",
                              "pssSkYds",
                          ],
                      },
                      {
                          name: "Rushing and Receiving",
                          stats: [
                              "gp",
                              "gs",
                              "rus",
                              "rusYds",
                              "rusTD",
                              "rusLng",
                              "tgt",
                              "rec",
                              "recYds",
                              "recTD",
                              "recLng",
                          ],
                      },
                      {
                          name: "Defense, Fumbles, and Penalties",
                          stats: [
                              "gp",
                              "gs",
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
                              "fmb",
                              "fmbLost",
                              "pen",
                              "penYds",
                          ],
                      },
                      {
                          name: "Kicking and Punting",
                          stats: [
                              "gp",
                              "gs",
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
                          ],
                      },
                      {
                          name: "Kick and Punt Returns",
                          stats: [
                              "gp",
                              "gs",
                              "pr",
                              "prYds",
                              "prTD",
                              "prLng",
                              "kr",
                              "krYds",
                              "krTD",
                              "krLng",
                          ],
                      },
                  ];

        const stats = Array.from(
            new Set(
                statTables.reduce((allStats, currentStats) => {
                    return allStats.concat(currentStats.stats);
                }, []),
            ),
        );
        console.log("stats", stats);

        let p = await idb.getCopy.players({ pid: inputs.pid });
        if (p === undefined) {
            return {
                errorMessage: "Player not found.",
            };
        }
        p = await idb.getCopy.playersPlus(p, {
            attrs: [
                "pid",
                "name",
                "tid",
                "abbrev",
                "teamRegion",
                "teamName",
                "age",
                "hgtFt",
                "hgtIn",
                "weight",
                "born",
                "diedYear",
                "contract",
                "draft",
                "face",
                "mood",
                "injury",
                "salaries",
                "salariesTotal",
                "awardsGrouped",
                "freeAgentMood",
                "imgURL",
                "watch",
                "college",
                "relatives",
                "untradable",
            ],
            ratings: [
                "season",
                "abbrev",
                "age",
                "ovr",
                "pot",
                ...ratings,
                "skills",
                "pos",
            ],
            stats: ["season", "tid", "abbrev", "age", ...stats],
            playoffs: true,
            showRookies: true,
            fuzz: true,
        });
        if (p === undefined) {
            return {
                errorMessage: "Player not found.",
            };
        }

        // Account for extra free agent demands
        if (p.tid === PLAYER.FREE_AGENT) {
            p.contract.amount = freeAgents.amountWithMood(
                p.contract.amount,
                p.freeAgentMood[g.userTid],
            );
        }

        let events = await idb.getCopies.events({ pid: inputs.pid });

        const feats = events
            .filter(event => event.type === "playerFeat")
            .map(event => {
                return {
                    eid: event.eid,
                    season: event.season,
                    text: event.text,
                };
            });

        events = events
            .filter(event => {
                return !(
                    event.type === "award" ||
                    event.type === "injured" ||
                    event.type === "healed" ||
                    event.type === "hallOfFame" ||
                    event.type === "playerFeat" ||
                    event.type === "tragedy"
                );
            })
            .map(event => {
                return {
                    eid: event.eid,
                    season: event.season,
                    text: event.text,
                };
            });

        events.forEach(helpers.correctLinkLid.bind(null, g.lid));
        feats.forEach(helpers.correctLinkLid.bind(null, g.lid));

        return {
            player: p,
            showTradeFor: p.tid !== g.userTid && p.tid >= 0,
            freeAgent: p.tid === PLAYER.FREE_AGENT,
            retired: p.tid === PLAYER.RETIRED,
            showContract:
                p.tid !== PLAYER.UNDRAFTED &&
                p.tid !== PLAYER.UNDRAFTED_2 &&
                p.tid !== PLAYER.UNDRAFTED_3 &&
                p.tid !== PLAYER.UNDRAFTED_FANTASY_TEMP &&
                p.tid !== PLAYER.RETIRED,
            injured: p.injury.type !== "Healthy",
            godMode: g.godMode,
            events,
            feats,
            ratings,
            statTables,
        };
    }
}

export default {
    runBefore: [updatePlayer],
};
