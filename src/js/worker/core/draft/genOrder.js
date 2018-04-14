// @flow

import { g } from "../../../common";
import genPicks from "./genPicks";
import logLotteryChances from "./logLotteryChances";
import logLotteryWinners from "./logLotteryWinners";
import lotterySort from "./lotterySort";
import setOrder from "./setOrder";
import updateChances from "./updateChances";
import { idb } from "../../db";
import { random } from "../../util";
import type { Conditions, DraftLotteryResult } from "../../../common/types";

/**
 * Sets draft order and save it to the draftOrder object store.
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
    const chances = [250, 199, 156, 119, 88, 63, 43, 28, 17, 11, 8, 7, 6, 5];
    updateChances(chances, teams, true);

    const chanceTotal = chances.reduce((a, b) => a + b);
    const chancePct = chances.map(c => c / chanceTotal * 100);

    // cumsum
    const chancesCumsum = chances.slice();
    for (let i = 1; i < chancesCumsum.length; i++) {
        chancesCumsum[i] += chancesCumsum[i - 1];
    }

    // Pick first three picks based on chancesCumsum
    const firstThree = [];
    while (firstThree.length < 3) {
        const draw = random.randInt(0, 999);
        const i = chancesCumsum.findIndex(chance => chance > draw);
        if (!firstThree.includes(i) && i < teams.length) {
            // If one lottery winner, select after other tied teams;
            teams[i].randVal -= 30;
            firstThree.push(i);
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

    // Reorganize this to an array indexed on originalTid and round
    const draftPicksIndexed = [];
    for (let i = 0; i < draftPicks.length; i++) {
        const tid = draftPicks[i].originalTid;
        // Initialize to an array
        if (
            draftPicksIndexed.length < tid ||
            draftPicksIndexed[tid] === undefined
        ) {
            draftPicksIndexed[tid] = [];
        }
        draftPicksIndexed[tid][draftPicks[i].round] = {
            tid: draftPicks[i].tid,
        };
    }

    if (!mock) {
        logLotteryChances(chancePct, teams, draftPicksIndexed, conditions);
    }

    const draftOrder = [];

    // First round - lottery winners
    for (let i = 0; i < firstThree.length; i++) {
        const tid = draftPicksIndexed[teams[firstThree[i]].tid][1].tid;
        draftOrder.push({
            round: 1,
            pick: i + 1,
            tid,
            originalTid: teams[firstThree[i]].tid,
        });

        if (!mock) {
            logLotteryWinners(
                chancePct,
                teams,
                tid,
                teams[firstThree[i]].tid,
                i + 1,
                conditions,
            );
        }
    }

    // First round - everyone else
    let pick = 4;
    for (let i = 0; i < teams.length; i++) {
        if (!firstThree.includes(i)) {
            const tid = draftPicksIndexed[teams[i].tid][1].tid;
            draftOrder.push({
                round: 1,
                pick,
                tid,
                originalTid: teams[i].tid,
            });

            if (pick < 15 && !mock) {
                logLotteryWinners(
                    chancePct,
                    teams,
                    tid,
                    teams[i].tid,
                    pick,
                    conditions,
                );
            }

            pick += 1;
        }
    }

    // Save draft lottery results separately
    const draftLotteryResult = {
        season: g.season,
        result: teams // Start with teams in lottery order
            .map(({ tid }) => {
                return draftOrder.find(
                    ({ originalTid, pick: pickNum, round }) => {
                        // Keep only lottery picks
                        return (
                            originalTid === tid &&
                            round === 1 &&
                            pickNum <= chances.length
                        );
                    },
                );
            })
            .filter(row => row !== undefined) // Keep only lottery picks
            // $FlowFixMe
            .map(({ pick: pickNum, originalTid, tid }) => {
                // For the team making the pick
                const t = teams.find(t2 => t2.tid === tid);
                let won = 0;
                let lost = 0;
                if (t) {
                    won = t.seasonAttrs.won;
                    lost = t.seasonAttrs.lost;
                }

                // For the original team
                const i = teams.findIndex(t2 => t2.tid === originalTid);

                return {
                    tid,
                    originalTid,
                    chances: chances[i],
                    pick: pickNum,
                    won,
                    lost,
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
    for (let i = 0; i < teams.length; i++) {
        const tid = draftPicksIndexed[teams[i].tid][2].tid;
        draftOrder.push({
            round: 2,
            pick: i + 1,
            tid,
            originalTid: teams[i].tid,
        });
    }

    if (!mock) {
        // Delete from draftPicks object store so that they are completely untradeable
        for (const dp of draftPicks) {
            await idb.cache.draftPicks.delete(dp.dpid);
        }

        await setOrder(draftOrder);
    }

    return draftLotteryResult;
};

export default genOrder;
