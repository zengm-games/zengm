// @flow

import { PHASE } from "../../common";
import { draft } from "../core";
import { idb } from "../db";
import { g } from "../util";
import type { DraftLotteryResultArray, UpdateEvents } from "../../common/types";

async function updateDraftLottery(
    { season }: { season: number },
    updateEvents: UpdateEvents,
    state: any,
): Promise<{
    result: DraftLotteryResultArray | void,
    season: number,
    type: "completed" | "projected" | "readyToRun",
} | void> {
    if (
        updateEvents.includes("firstRun") ||
        updateEvents.includes("newPhase") ||
        season !== state.season ||
        (season === g.season && updateEvents.includes("gameSim"))
    ) {
        // View completed draft lottery
        if (
            season < g.season ||
            (season === g.season && g.phase >= PHASE.DRAFT_LOTTERY)
        ) {
            const draftLotteryResult = await idb.getCopy.draftLotteryResults({
                season,
            });

            // If season === g.season && g.phase === PHASE.DRAFT_LOTTERY, this will be undefined if the lottery is not done yet
            if (draftLotteryResult || g.phase > PHASE.DRAFT_LOTTERY) {
                const result =
                    draftLotteryResult !== undefined
                        ? draftLotteryResult.result
                        : undefined;

                // Past lotteries before draftLotteryResult.draftType were all 1994
                let draftType;
                if (draftLotteryResult !== undefined) {
                    draftType = draftLotteryResult.draftType || "nba1994";
                }

                return {
                    draftType,
                    result,
                    season,
                    ties: g.ties,
                    type: "completed",
                    userTid: g.userTid,
                };
            }

            if (season < g.season) {
                // Maybe there was no draft lottery done, or it was deleted from the database
                return {
                    draftType: "noLottery",
                    result: undefined,
                    season,
                    ties: g.ties,
                    type: "completed",
                    userTid: g.userTid,
                };
            }
        }

        // View projected draft lottery for this season
        const draftLotteryResult = await draft.genOrderNBA(true);

        for (const pick of draftLotteryResult.result) {
            pick.pick = undefined;
        }

        const type =
            season === g.season && g.phase === PHASE.DRAFT_LOTTERY
                ? "readyToRun"
                : "projected";

        return {
            draftType: draftLotteryResult.draftType,
            result: draftLotteryResult.result,
            season: draftLotteryResult.season,
            ties: g.ties,
            type,
            userTid: g.userTid,
        };
    }
}

export default {
    runBefore: [updateDraftLottery],
};
