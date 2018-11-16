// @flow

import logAction from "./logAction";
import logLotteryTxt from "./logLotteryTxt";
import type {
    Conditions,
    DraftPick,
    TeamFiltered,
} from "../../../../deion/common/types";

const logLotteryChances = (
    chances: number[],
    teams: TeamFiltered[],
    draftPicksIndexed: DraftPick[][],
    conditions?: Conditions,
) => {
    for (let i = 0; i < chances.length; i++) {
        if (i < teams.length) {
            const originalTid = teams[i].tid;
            const tid = draftPicksIndexed[originalTid][1].tid;
            const txt = logLotteryTxt(tid, "chance", chances[i]);
            logAction(tid, txt, conditions);
        }
    }
};

export default logLotteryChances;
