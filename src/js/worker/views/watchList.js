// @flow

import { PLAYER, g } from "../../common";
import { freeAgents } from "../core";
import { idb } from "../db";
import type { UpdateEvents, PlayerStatType } from "../../common/types";

async function updatePlayers(
    inputs: {
        playoffs: "playoffs" | "regularSeasons",
        statType: PlayerStatType,
    },
    updateEvents: UpdateEvents,
    state: any,
): void | { [key: string]: any } {
    if (
        updateEvents.includes("watchList") ||
        updateEvents.includes("gameSim") ||
        updateEvents.includes("playerMovement") ||
        inputs.statType !== state.statType ||
        inputs.playoffs !== state.playoffs
    ) {
        let players = await idb.getCopies.players();
        players = players.filter(p => p.watch && typeof p.watch !== "function"); // In Firefox, objects have a "watch" function
        players = await idb.getCopies.playersPlus(players, {
            attrs: [
                "pid",
                "name",
                "age",
                "injury",
                "tid",
                "abbrev",
                "watch",
                "contract",
                "freeAgentMood",
                "draft",
            ],
            ratings: ["ovr", "pot", "skills", "pos"],
            stats: [
                "gp",
                "min",
                "fgp",
                "tpp",
                "ftp",
                "trb",
                "ast",
                "tov",
                "stl",
                "blk",
                "pts",
                "per",
                "ewa",
            ],
            season: g.season,
            statType: inputs.statType,
            playoffs: inputs.playoffs === "playoffs",
            regularSeason: inputs.playoffs !== "playoffs",
            fuzz: true,
            showNoStats: true,
            showRookies: true,
            showRetired: true,
            oldStats: true,
        });

        // Add mood to free agent contracts
        for (let i = 0; i < players.length; i++) {
            if (players[i].tid === PLAYER.FREE_AGENT) {
                players[i].contract.amount = freeAgents.amountWithMood(
                    players[i].contract.amount,
                    players[i].freeAgentMood[g.userTid],
                );
            }
        }

        return {
            players,
            playoffs: inputs.playoffs,
            statType: inputs.statType,
        };
    }
}

export default {
    runBefore: [updatePlayers],
};
