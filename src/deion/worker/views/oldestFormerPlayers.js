// @flow

import { idb } from "../db";
import { g } from "../util";
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
            filter: p => {
                const age =
                    typeof p.diedYear === "number"
                        ? p.diedYear - p.born.year
                        : g.season - p.born.year;
                return age >= 85;
            },
        });
        players = await idb.getCopies.playersPlus(players, {
            attrs: [
                "pid",
                "name",
                "draft",
                "retiredYear",
                "statsTids",
                "hof",
                "age",
                "ageAtDeath",
                "born",
                "diedYear",
            ],
            ratings: ["ovr", "pos"],
            stats: ["season", "abbrev", "tid", ...stats],
            fuzz: true,
        });

        players.sort(
            (a, b) =>
                (typeof b.ageAtDeath === "number" ? b.ageAtDeath : b.age) -
                (typeof a.ageAtDeath === "number" ? a.ageAtDeath : a.age),
        );
        players = players.slice(0, 100);

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
