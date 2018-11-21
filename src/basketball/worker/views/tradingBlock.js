// @flow

import { idb } from "../db";
import { g, helpers } from "../../../deion/worker/util";
import type { GetOutput, UpdateEvents } from "../../../deion/common/types";

async function updateUserRoster(
    inputs: GetOutput,
    updateEvents: UpdateEvents,
): void | { [key: string]: any } {
    if (
        updateEvents.includes("firstRun") ||
        updateEvents.includes("playerMovement") ||
        updateEvents.includes("gameSim")
    ) {
        const stats = ["min", "pts", "trb", "ast", "per"];

        let [userRoster, userPicks] = await Promise.all([
            idb.cache.players.indexGetAll("playersByTid", g.userTid),
            await idb.getCopies.draftPicks({ tid: g.userTid }),
        ]);

        userRoster = await idb.getCopies.playersPlus(userRoster, {
            attrs: [
                "pid",
                "name",
                "age",
                "contract",
                "injury",
                "watch",
                "untradable",
            ],
            ratings: ["ovr", "pot", "skills", "pos"],
            stats,
            season: g.season,
            tid: g.userTid,
            showNoStats: true,
            showRookies: true,
            fuzz: true,
        });

        for (const dp of userPicks) {
            dp.desc = helpers.pickDesc(dp);
        }

        return {
            gameOver: g.gameOver,
            phase: g.phase,
            stats,
            userPicks,
            userRoster,
        };
    }
}

export default {
    runBefore: [updateUserRoster],
};
