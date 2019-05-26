// @flow

import { idb } from "../db";
import { g, processPlayersHallOfFame } from "../util";
import type { GetOutput, UpdateEvents } from "../../common/types";

async function updatePlayers(
    inputs: GetOutput,
    updateEvents: UpdateEvents,
): void | { [key: string]: any } {
    // In theory should update more frequently, but the list is potentially expensive to update and rarely changes
    if (updateEvents.includes("firstRun")) {
        const stats =
            process.env.SPORT === "basketball"
                ? ["gp", "min", "pts", "trb", "ast", "per", "ewa", "ws", "ws48"]
                : ["gp", "keyStats", "av"];

        let players = await idb.getCopies.players({
            filter: p => p.relatives.length > 0,
        });
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
        console.log(players);

        processPlayersHallOfFame(players);

        return {
            players,
            stats,
            userTid: g.userTid,
        };
    }
}

export default {
    runBefore: [updatePlayers],
};
