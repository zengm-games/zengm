// @flow

import { idb } from "../../../../deion/worker/db";
import { g } from "../../../../deion/worker/util";
import { POSITIONS } from "../../../common";
import type { Position } from "../../../common/types";

const rosterAutoSort = async (tid: number, pos?: Position) => {
    const t = await idb.cache.teams.get(tid);
    if (!t.hasOwnProperty("depth")) {
        throw new Error("depth property missing on team object");
    }

    const playersFromCache = await idb.cache.players.indexGetAll(
        "playersByTid",
        tid,
    );
    const players = await idb.getCopies.playersPlus(playersFromCache, {
        attrs: ["pid"],
        ratings: ["ovrs"],
        season: g.season,
        showNoStats: true,
        showRookies: true,
        fuzz: true,
    });

    const positions = pos ? [pos] : POSITIONS;
    for (const pos2 of positions) {
        players.sort((a, b) => b.ratings.ovrs[pos2] - a.ratings.ovrs[pos2]);
        t.depth[pos2] = players.map(p => p.pid);
    }
    await idb.cache.teams.put(t);
};

export default rosterAutoSort;
