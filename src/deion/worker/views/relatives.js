// @flow

import { idb } from "../db";
import { g, processPlayersHallOfFame } from "../util";
import type { UpdateEvents } from "../../common/types";

async function updatePlayers(
    { pid }: { pid?: number },
    updateEvents: UpdateEvents,
    state: any,
): void | { [key: string]: any } {
    // In theory should update more frequently, but the list is potentially expensive to update and rarely changes
    if (updateEvents.includes("firstRun") || pid !== state.pid) {
        const stats =
            process.env.SPORT === "basketball"
                ? ["gp", "min", "pts", "trb", "ast", "per", "ewa", "ws", "ws48"]
                : ["gp", "keyStats", "av"];

        let players = [];

        if (typeof pid === "number") {
            const target = await idb.getCopy.players({
                pid,
            });
            if (target) {
                const pids = target.relatives.map(rel => rel.pid);

                const otherPlayers = await idb.getCopies.players({
                    pids,
                });

                players = [target, ...otherPlayers];
            }
        } else {
            players = await idb.getCopies.players({
                filter: p => p.relatives.length > 0,
            });
        }

        players = await idb.getCopies.playersPlus(players, {
            attrs: [
                "pid",
                "name",
                "draft",
                "retiredYear",
                "statsTids",
                "hof",
                "relatives",
                "numBrothers",
                "numFathers",
                "numSons",
            ],
            ratings: ["ovr", "pos"],
            stats: ["season", "abbrev", "tid", ...stats],
            fuzz: true,
        });

        processPlayersHallOfFame(players);

        return {
            pid,
            players,
            stats,
            userTid: g.userTid,
        };
    }
}

export default {
    runBefore: [updatePlayers],
};
