// @flow

import { idb } from "../../../deion/worker/db";
import { g } from "../../../deion/worker/util";
import type { UpdateEvents } from "../../../deion/common/types";
import type { Position } from "../../common/types";

const stats: {
    [key: Position]: string[],
} = {
    QB: ["pssYds", "pssTD", "pssInt"],
    RB: [],
    WR: [],
    TE: [],
    OL: [],
    C: [],
    DL: [],
    LB: [],
    CB: [],
    S: [],
    K: [],
    P: [],
    KR: [],
    PR: [],
};

async function updateDepth(
    { pos }: { pos: Position },
    updateEvents: UpdateEvents,
    state: any,
): void | { [key: string]: any } {
    if (
        updateEvents.includes("firstRun") ||
        updateEvents.includes("gameSim") ||
        updateEvents.includes("playerMovement") ||
        pos !== state.pos
    ) {
        let players = await idb.cache.players.indexGetAll(
            "playersByTid",
            g.userTid,
        );
        players = await idb.getCopies.playersPlus(players, {
            attrs: ["pid", "name", "age", "injury", "watch"],
            ratings: ["skills", "pos", "ovr", "pot"],
            stats: stats[pos],
            season: g.season,
        });

        console.log(pos, stats[pos]);
        return {
            abbrev: g.teamAbbrevsCache[g.userTid],
            pos,
            players,
            season: g.season,
            stats: stats.hasOwnProperty(pos) ? stats[pos] : [],
        };
    }
}

export default {
    runBefore: [updateDepth],
};
