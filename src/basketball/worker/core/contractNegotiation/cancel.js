// @flow

import { PHASE } from "../../../../deion/common";
import { idb } from "../../../../deion/worker/db";
import {
    g,
    lock,
    updatePlayMenu,
    updateStatus,
} from "../../../../deion/worker/util";

/**
 * Cancel contract negotiations with a player.
 */
const cancel = async (pid: number) => {
    await idb.cache.negotiations.delete(pid);
    const negotiationInProgress = await lock.negotiationInProgress();
    if (!negotiationInProgress) {
        if (g.phase === PHASE.FREE_AGENCY) {
            await updateStatus(`${g.daysLeft} days left`);
        } else {
            await updateStatus("Idle");
        }
        updatePlayMenu();
    }
};

export default cancel;
