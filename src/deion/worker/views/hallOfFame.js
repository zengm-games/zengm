// @flow

import { PHASE } from "../../common";
import { idb } from "../db";
import { g, processPlayersHallOfFame } from "../util";
import type { GetOutput, UpdateEvents } from "../../common/types";

async function updatePlayers(
    inputs: GetOutput,
    updateEvents: UpdateEvents,
): void | { [key: string]: any } {
    if (
        updateEvents.includes("firstRun") ||
        (updateEvents.includes("newPhase") && g.phase === PHASE.DRAFT_LOTTERY)
    ) {
        const stats =
            process.env.SPORT === "basketball"
                ? ["gp", "min", "pts", "trb", "ast", "per", "ewa", "ws", "ws48"]
                : ["keyStats", "av"];

        let players = await idb.getCopies.players({
            retired: true,
            filter: p => p.hof,
        });
        players = await idb.getCopies.playersPlus(players, {
            attrs: ["pid", "name", "draft", "retiredYear", "statsTids"],
            ratings: ["ovr", "pos"],
            stats: ["season", "abbrev", "tid", ...stats],
            fuzz: true,
        });

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
