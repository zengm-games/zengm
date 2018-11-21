// @flow

import { PHASE, PLAYER } from "../../../deion/common";
import { idb } from "../../../deion/worker/db";
import { g } from "../../../deion/worker/util";
import type { UpdateEvents } from "../../../deion/common/types";

async function updatePlayers(
    inputs: { season: number },
    updateEvents: UpdateEvents,
    state: any,
): void | { [key: string]: any } {
    if (
        (inputs.season === g.season &&
            (updateEvents.includes("gameSim") ||
                updateEvents.includes("playerMovement"))) ||
        inputs.season !== state.season
    ) {
        let players;
        if (g.season === inputs.season && g.phase <= PHASE.PLAYOFFS) {
            players = await idb.cache.players.indexGetAll("playersByTid", [
                PLAYER.FREE_AGENT,
                Infinity,
            ]);
        } else {
            players = await idb.getCopies.players({
                activeSeason: inputs.season,
            });
        }
        players = await idb.getCopies.playersPlus(players, {
            attrs: ["pid", "name", "age", "injury", "watch"],
            ratings: ["skills", "pos"],
            stats: [
                "abbrev",
                "gp",
                "gs",
                "min",
                "fgAtRim",
                "fgaAtRim",
                "fgpAtRim",
                "fgLowPost",
                "fgaLowPost",
                "fgpLowPost",
                "fgMidRange",
                "fgaMidRange",
                "fgpMidRange",
                "tid",
                "tp",
                "tpa",
                "tpp",
            ],
            season: inputs.season,
        });

        return {
            season: inputs.season,
            players,
            userTid: g.userTid,
        };
    }
}

export default {
    runBefore: [updatePlayers],
};
