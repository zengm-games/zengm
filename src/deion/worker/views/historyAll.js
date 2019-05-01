// @flow

import { PHASE } from "../../common";
import { idb } from "../db";
import { g } from "../util";
import type { GetOutput, UpdateEvents } from "../../common/types";

async function updateHistory(
    inputs: GetOutput,
    updateEvents: UpdateEvents,
): void | { [key: string]: any } {
    if (
        updateEvents.includes("firstRun") ||
        (updateEvents.includes("newPhase") && g.phase === PHASE.DRAFT_LOTTERY)
    ) {
        const [awards, teams] = await Promise.all([
            idb.getCopies.awards(),
            idb.getCopies.teamsPlus({
                attrs: ["tid", "abbrev", "region", "name"],
                seasonAttrs: [
                    "season",
                    "playoffRoundsWon",
                    "won",
                    "lost",
                    "tied",
                ],
            }),
        ]);

        const awardNames =
            process.env.SPORT === "basketball"
                ? ["finalsMvp", "mvp", "dpoy", "smoy", "mip", "roy"]
                : ["finalsMvp", "mvp", "dpoy", "oroy", "droy"];

        const seasons = awards.map(a => {
            return {
                season: a.season,
                finalsMvp: a.finalsMvp,
                mvp: a.mvp,
                dpoy: a.dpoy,
                smoy: a.smoy,
                mip: a.mip,
                roy: a.roy,
                oroy: a.oroy,
                droy: a.droy,
                runnerUp: undefined,
                champ: undefined,
            };
        });

        // Use this rather than numGamesPlayoffSeries in case configuration changes during a league
        const maxPlayoffRoundsWon = teams[0].seasonAttrs.map(
            (seasonAttrs, i) => {
                return teams.reduce((max, t) => {
                    return t.seasonAttrs[i] &&
                        t.seasonAttrs[i].playoffRoundsWon > max
                        ? t.seasonAttrs[i].playoffRoundsWon
                        : max;
                }, 0);
            },
        );

        for (const t of teams) {
            // t.seasonAttrs has same season entries as the "seasons" array built from awards
            for (let i = 0; i < seasons.length; i++) {
                // Find corresponding entries in seasons and t.seasonAttrs. Can't assume they are the same because they aren't if some data has been deleted (Delete Old Data)
                let found = false;
                let j;
                for (j = 0; j < t.seasonAttrs.length; j++) {
                    if (t.seasonAttrs[j].season === seasons[i].season) {
                        found = true;
                        break;
                    }
                }
                if (!found) {
                    continue;
                }

                if (
                    t.seasonAttrs[j].playoffRoundsWon === maxPlayoffRoundsWon[j]
                ) {
                    seasons[i].champ = {
                        tid: t.tid,
                        abbrev: t.abbrev,
                        region: t.region,
                        name: t.name,
                        won: t.seasonAttrs[j].won,
                        lost: t.seasonAttrs[j].lost,
                        tied: t.seasonAttrs[j].tied,
                        count: 0,
                    };
                } else if (
                    t.seasonAttrs[j].playoffRoundsWon ===
                    maxPlayoffRoundsWon[j] - 1
                ) {
                    seasons[i].runnerUp = {
                        tid: t.tid,
                        abbrev: t.abbrev,
                        region: t.region,
                        name: t.name,
                        won: t.seasonAttrs[j].won,
                        lost: t.seasonAttrs[j].lost,
                        tied: t.seasonAttrs[j].tied,
                    };
                }
            }
        }

        // Count up number of championships per team
        const championshipsByTid = Array(g.numTeams).fill(0);
        for (let i = 0; i < seasons.length; i++) {
            if (seasons[i].champ) {
                championshipsByTid[seasons[i].champ.tid] += 1;
                seasons[i].champ.count =
                    championshipsByTid[seasons[i].champ.tid];
            }
        }

        return {
            awards: awardNames,
            seasons,
            teamAbbrevsCache: g.teamAbbrevsCache,
            ties: g.ties,
            userTid: g.userTid,
        };
    }
}

export default {
    runBefore: [updateHistory],
};
