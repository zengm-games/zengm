// @flow

import logAction from "./logAction";
import logLotteryTxt from "./logLotteryTxt";
import type { Conditions, TeamFiltered } from "../../../common/types";

const logLotteryWinners = (
    chances: number[],
    teams: TeamFiltered[],
    tm: number,
    origTm: number,
    pick: number,
    conditions?: Conditions,
) => {
    const idx = teams.find(t => t.tid === origTm);
    if (idx !== undefined) {
        let txt;
        if (chances[idx] < chances[pick - 1]) {
            txt = logLotteryTxt(tm, "movedup", pick);
        } else if (chances[idx] > chances[pick - 1]) {
            txt = logLotteryTxt(tm, "moveddown", pick);
        } else {
            txt = logLotteryTxt(tm, "normal", pick);
        }
        logAction(tm, txt, conditions);
    }
};

export default logLotteryWinners;
