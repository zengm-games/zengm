// @flow

import logAction from "./logAction";
import logLotteryTxt from "./logLotteryTxt";
import type { Conditions, TeamFiltered } from "../../../common/types";

const logLotteryChances = (
    chances: number[],
    teams: TeamFiltered[],
    draftOrder: {
        tid: number,
    }[][],
    conditions?: Conditions,
) => {
    for (let i = 0; i < chances.length; i++) {
        if (i < teams.length) {
            const origTm = teams[i].tid;
            const tm = draftOrder[origTm][1].tid;
            const txt = logLotteryTxt(tm, "chance", chances[i]);
            logAction(tm, txt, conditions);
        }
    }
};

export default logLotteryChances;
