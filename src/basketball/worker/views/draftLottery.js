// @flow

import { PHASE } from "../../../deion/common";
import { draft } from "../core";
import { idb } from "../../../deion/worker/db";
import { g } from "../../../deion/worker/util";
import type {
    DraftLotteryResultArray,
    UpdateEvents,
} from "../../../deion/common/types";

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

                return {
                    result,
                    season,
                    type: "completed",
                    userTid: g.userTid,
                };
            }
        }

        // View projected draft lottery for this season
        const draftLotteryResult = await draft.genOrder(true);

        for (const pick of draftLotteryResult.result) {
            pick.pick = undefined;
        }

        const type =
            season === g.season && g.phase === PHASE.DRAFT_LOTTERY
                ? "readyToRun"
                : "projected";

        return {
            result: draftLotteryResult.result,
            season: draftLotteryResult.season,
            type,
            userTid: g.userTid,
        };
    }
}

export default {
    runBefore: [updateDraftLottery],
};
