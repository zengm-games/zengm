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
            ratings: ["skills", "pos", "ovr", "pot", "ovrs", "pots"],
            stats: stats[pos],
            season: g.season,
            fuzz: true,
        });

        // Sort players based on current depth chart
        const t = await idb.cache.teams.get(g.userTid);
        const depth = t.depth[pos];

        // Start with players in depth, then add others in arbitrary order
        const playersSorted = depth
            .map(pid => players.find(p => p.pid === pid))
            .concat(players.map(p => (depth.includes(p.pid) ? undefined : p)))
            .filter(p => p !== undefined);

        return {
            abbrev: g.teamAbbrevsCache[g.userTid],
            pos,
            players: playersSorted,
            season: g.season,
            stats: stats.hasOwnProperty(pos) ? stats[pos] : [],
        };
    }
}

export default {
    runBefore: [updateDepth],
};
