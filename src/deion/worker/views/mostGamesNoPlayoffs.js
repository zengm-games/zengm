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
            filter: p =>
                p.stats.length > 0 &&
                p.stats.filter(ps => ps.playoffs).length === 0,
        });
        players = await idb.getCopies.playersPlus(players, {
            attrs: ["pid", "name", "draft", "retiredYear", "statsTids", "hof"],
            ratings: ["ovr", "pos"],
            stats: ["season", "abbrev", "tid", ...stats],
            fuzz: true,
        });

        players.sort((a, b) => b.careerStats.gp - a.careerStats.gp);
        players = players.slice(0, 100);

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
