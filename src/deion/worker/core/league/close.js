// @flow

import { idb } from "../../db";
import { g, local, lock, updateStatus } from "../../util";

// Flush cache, disconnect from league database, and unset g.lid
const close = async (disconnect?: boolean) => {
    const gameSim = lock.get("gameSim");

    local.autoPlaySeasons = 0;
    lock.set("stopGameSim", true);
    lock.set("gameSim", false);

    // Wait in case stuff is still happening (ugh)
    if (gameSim) {
        await new Promise(resolve => {
            setTimeout(() => {
                resolve();
            }, 1000);
        });
    }

    if (g.lid !== undefined && idb.league !== undefined) {
        if (local.leagueLoaded) {
            await updateStatus("Saving...");
            await idb.cache.flush();
            await updateStatus("Idle");
        }

        if (disconnect) {
            idb.cache.stopAutoFlush();

            // Should probably "close" cache here too, but no way to do that now

            idb.league.close();
        }
    }

    if (disconnect) {
        lock.reset();
        local.reset();

        g.lid = undefined;
    }
};

export default close;
