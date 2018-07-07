// @flow

import { trade } from "../core";
import { idb } from "../db";
import { g, helpers } from "../util";
import type { GetOutput, UpdateEvents } from "../../common/types";

async function updateUserRoster(
    inputs: GetOutput,
    updateEvents: UpdateEvents,
): void | { [key: string]: any } {
    if (
        updateEvents.includes("firstRun") ||
        updateEvents.includes("playerMovement") ||
        updateEvents.includes("gameSim")
    ) {
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
                "gamesUntilTradable",
                "watch",
            ],
            ratings: ["ovr", "pot", "skills", "pos"],
            stats: ["min", "pts", "trb", "ast", "per"],
            season: g.season,
            tid: g.userTid,
            showNoStats: true,
            showRookies: true,
            fuzz: true,
        });
        userRoster = trade.filterUntradable(userRoster);

        for (const dp of userPicks) {
            dp.desc = helpers.pickDesc(dp);
        }

        return {
            gameOver: g.gameOver,
            phase: g.phase,
            userPicks,
            userRoster,
        };
    }
}

export default {
    runBefore: [updateUserRoster],
};
