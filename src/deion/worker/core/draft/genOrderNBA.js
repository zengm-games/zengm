// @flow

import genPicks from "./genPicks";
import logLotteryChances from "./logLotteryChances";
import logLotteryWinners from "./logLotteryWinners";
import lotterySort from "./lotterySort";
import updateChances from "./updateChances";
import { idb } from "../../db";
import { g, helpers, random } from "../../util";
import type { Conditions, DraftLotteryResult } from "../../../common/types";

/**
 * Sets draft order and save it to the draftPicks object store.
 *
 * This is currently based on an NBA-like lottery, where the first 3 picks can be any of the non-playoff teams (with weighted probabilities).
 *
 * If mock is true, then nothing is actually saved to the database and no notifications are sent
 *
 * @memberOf core.draft
 * @return {Promise}
 */
const genOrder = async (
    mock?: boolean = false,
    conditions?: Conditions,
): Promise<DraftLotteryResult> => {
    const teams = await idb.getCopies.teamsPlus({
        attrs: ["tid", "cid"],
        seasonAttrs: ["winp", "playoffRoundsWon", "won", "lost"],
        season: g.season,
    });

    // Draft lottery
    lotterySort(teams);
    let chances =
        g.draftType === "nba1994"
            ? [250, 199, 156, 119, 88, 63, 43, 28, 17, 11, 8, 7, 6, 5]
            : [140, 140, 140, 125, 105, 90, 75, 60, 45, 30, 20, 15, 10, 5];

    // Change number of teams in lottery, based on number of playoff teams
    const numPlayoffTeams =
        2 ** g.numGamesPlayoffSeries.length - g.numPlayoffByes;
    const minNumLotteryTeams = g.draftType === "nba1994" ? 3 : 4; // Otherwise would require changes to draft lottery algorithm
    const numLotteryTeams = helpers.bound(
        g.numTeams - numPlayoffTeams,
        minNumLotteryTeams,
        g.numTeams,
    );
    if (numLotteryTeams < chances.length) {
        chances = chances.slice(0, numLotteryTeams);
    } else {
        while (numLotteryTeams > chances.length) {
            chances.push(5);
        }
    }

    updateChances(chances, teams, true);

    const chanceTotal = chances.reduce((a, b) => a + b);
    const chancePct = chances.map(c => (c / chanceTotal) * 100);

    // cumsum
    const chancesCumsum = chances.slice();
    for (let i = 1; i < chancesCumsum.length; i++) {
        chancesCumsum[i] += chancesCumsum[i - 1];
    }
    const totalChances = chancesCumsum[chancesCumsum.length - 1];

    // Pick first 3 or 4 picks based on chancesCumsum
    const numToPick = g.draftType === "nba1994" ? 3 : 4;
    const firstN = [];
    while (firstN.length < numToPick) {
        const draw = random.randInt(0, totalChances - 1);
        const i = chancesCumsum.findIndex(chance => chance > draw);
        if (!firstN.includes(i) && i < teams.length) {
            // If one lottery winner, select after other tied teams;
            teams[i].randVal -= 30;
            firstN.push(i);
        }
    }

    let draftPicks = await idb.cache.draftPicks.indexGetAll(
        "draftPicksBySeason",
        g.season,
    );

    // Sometimes picks just fail to generate or get lost, for reasons I don't understand
    if (draftPicks.length < 2 * g.numTeams) {
        await genPicks(g.season, draftPicks);
        draftPicks = await idb.cache.draftPicks.indexGetAll(
            "draftPicksBySeason",
            g.season,
        );
    }

    // Because we're editing this later, and sometimes this is called with mock=true
    draftPicks = helpers.deepCopy(draftPicks);

    // Reorganize this to an array indexed on originalTid and round
    const draftPicksIndexed = [];
    for (const dp of draftPicks) {
        const tid = dp.originalTid;
        // Initialize to an array
        if (
            draftPicksIndexed.length < tid ||
            draftPicksIndexed[tid] === undefined
        ) {
            draftPicksIndexed[tid] = [];
        }
        draftPicksIndexed[tid][dp.round] = dp;
    }

    if (!mock) {
        logLotteryChances(chancePct, teams, draftPicksIndexed, conditions);
    }

    // First round - lottery winners
    for (let i = 0; i < firstN.length; i++) {
        const dp = draftPicksIndexed[teams[firstN[i]].tid][1];
        if (dp !== undefined) {
            dp.pick = i + 1;

            if (!mock) {
                logLotteryWinners(
                    chancePct,
                    teams,
                    dp.tid,
                    teams[firstN[i]].tid,
                    i + 1,
                    conditions,
                );
            }
        }
    }

    // First round - everyone else
    let pick = firstN.length + 1;
    for (let i = 0; i < teams.length; i++) {
        if (!firstN.includes(i)) {
            const dp = draftPicksIndexed[teams[i].tid][1];
            if (dp) {
                dp.pick = pick;

                if (pick < 15 && !mock) {
                    logLotteryWinners(
                        chancePct,
                        teams,
                        dp.tid,
                        teams[i].tid,
                        pick,
                        conditions,
                    );
                }
            }

            pick += 1;
        }
    }

    // Save draft lottery results separately
    const draftLotteryResult = {
        season: g.season,
        draftType: g.draftType === "nba1994" ? "nba1994" : "nba2019",
        result: teams // Start with teams in lottery order
            .map(({ tid }) => {
                return draftPicks.find(dp => {
                    // Keep only lottery picks
                    return (
                        dp.originalTid === tid &&
                        dp.round === 1 &&
                        dp.pick > 0 &&
                        dp.pick <= chances.length
                    );
                });
            })
            .filter(dp => dp !== undefined) // Keep only lottery picks
            .map(dp => {
                if (dp === undefined) {
                    throw new Error("Should never happen");
                }
                // For the team making the pick
                const t = teams.find(t2 => t2.tid === dp.tid);
                let won = 0;
                let lost = 0;
                let tied = 0;
                if (t) {
                    won = t.seasonAttrs.won;
                    lost = t.seasonAttrs.lost;
                    tied = t.seasonAttrs.tied;
                }

                // For the original team
                const i = teams.findIndex(t2 => t2.tid === dp.originalTid);

                return {
                    tid: dp.tid,
                    originalTid: dp.originalTid,
                    chances: chances[i],
                    pick: dp.pick,
                    won,
                    lost,
                    tied,
                };
            }),
    };
    if (!mock) {
        await idb.cache.draftLotteryResults.put(draftLotteryResult);
    }

    // Sort by winp with reverse randVal for tiebreakers.
    teams.sort((a, b) => {
        const r = a.seasonAttrs.winp - b.seasonAttrs.winp;
        return r === 0 ? b.randVal - a.randVal : r;
    });

    // Second round
    for (let round = 2; round <= g.numDraftRounds; round++) {
        for (let i = 0; i < teams.length; i++) {
            const dp = draftPicksIndexed[teams[i].tid][round];
            if (dp !== undefined) {
                dp.pick = i + 1;
            }
        }
    }

    if (!mock) {
        for (const dp of draftPicks) {
            await idb.cache.draftPicks.put(dp);
        }
    }

    return draftLotteryResult;
};

export default genOrder;
