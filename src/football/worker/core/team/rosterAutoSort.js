// @flow

import { idb } from "../../../../deion/worker/db";
import { g } from "../../../../deion/worker/util";
import { POSITIONS } from "../../../common/constants";
import type { Position } from "../../../common/types";

const rosterAutoSort = async (tid: number, pos?: Position) => {
    const t = await idb.cache.teams.get(tid);
    const depth = t.depth;
    if (depth === undefined) {
        throw new Error("Missing depth");
    }

    const playersFromCache = await idb.cache.players.indexGetAll(
        "playersByTid",
        tid,
    );
    const players = await idb.getCopies.playersPlus(playersFromCache, {
        attrs: ["pid"],
        ratings: ["pos", "ovrs"],
        season: g.season,
        showNoStats: true,
        showRookies: true,
        fuzz: true,
    });

    const positions = pos ? [pos] : POSITIONS;
    for (const pos2 of positions) {
        players.sort((a, b) => {
            let aScore = a.ratings.ovrs[pos2];
            if (a.ratings.pos === pos2) {
                aScore += 5;
            }

            let bScore = b.ratings.ovrs[pos2];
            if (b.ratings.pos === pos2) {
                bScore += 5;
            }

            return bScore - aScore;
        });
        depth[pos2] = players.map(p => p.pid);
    }
    await idb.cache.teams.put(t);
};

export default rosterAutoSort;
