// @flow

import { PHASE } from "../../../common";
import { league } from "..";
import { idb } from "../../db";
import {
    local,
    lock,
    toUI,
    updatePhase,
    updatePlayMenu,
    updateStatus,
} from "../../util";
import type { Conditions, Phase, UpdateEvents } from "../../../common/types";

/**
 * Common tasks run after a new phrase is set.
 *
 * This updates the phase, executes a callback, and (if necessary) updates the UI. It should only be called from one of the NewPhase* functions defined below.
 *
 * @memberOf core.phase
 * @param {number} phase Integer representing the new phase of the game (see other functions in this module).
 * @param {string=} url Optional URL to pass to api.realtimeUpdate for redirecting on new phase. If undefined, then the current page will just be refreshed.
 * @param {Array.<string>=} updateEvents Array of strings.
 * @return {Promise}
 */
const finalize = async (
    phase: Phase,
    url: string,
    updateEvents: UpdateEvents = [],
    conditions: Conditions,
) => {
    await updateStatus("Saving...");

    // Set phase before saving to database
    await league.setGameAttributes({
        phase,
    });

    // Fill only in preseason, because not much changes before then
    await idb.cache.flush();
    if (phase === PHASE.PRESEASON) {
        await idb.cache.fill();
    }

    lock.set("newPhase", false);
    await updatePhase();
    await updatePlayMenu();
    await updateStatus("Idle");

    updateEvents.push("newPhase");

    // If auto-simulating, initiate next action but don't redirect to a new URL
    if (local.autoPlaySeasons > 0) {
        toUI(["realtimeUpdate", updateEvents]);
        // Not totally sure why setTimeout is needed, but why not?
        await league.autoPlay(conditions);
    } else {
        toUI(["realtimeUpdate", updateEvents, url], conditions).then(() => {
            // This will refresh the url above inadvertently, because there is no way currently to say "refresh tabs except the one in conditions"
            return toUI(["realtimeUpdate", updateEvents]);
        });
    }
};

export default finalize;
