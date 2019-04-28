// @flow

import { PHASE } from "../../../common";
import { g, logEvent } from "../../util";
import type { Conditions } from "../../../common/types";

const logAction = (tid: number, text: string, conditions?: Conditions) => {
    // Don't show notification during lottery UI, it will spoil it!
    const showNotification =
        tid === g.userTid && g.phase !== PHASE.DRAFT_LOTTERY;

    logEvent(
        {
            type: "draft",
            text,
            showNotification,
            pids: [],
            tids: [tid],
        },
        conditions,
    );
};

export default logAction;
