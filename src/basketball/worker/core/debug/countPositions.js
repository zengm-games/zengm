// @flow

import backboard from "backboard";
import { PLAYER } from "../../../../deion/common";
import pos from "../player/pos";
import { idb } from "../../db";

const countPositions = async () => {
    // All non-retired players
    const players = await idb.league.players
        .index("tid")
        .getAll(backboard.lowerBound(PLAYER.FREE_AGENT));

    const counts = {
        PG: 0,
        G: 0,
        SG: 0,
        GF: 0,
        SF: 0,
        F: 0,
        PF: 0,
        FC: 0,
        C: 0,
    };

    for (const p of players) {
        const r = p.ratings[p.ratings.length - 1];

        // Dynamically recompute, to make dev easier when changing position formula
        const position = pos(r);

        counts[position] += 1;
    }

    console.table(counts);
};

export default countPositions;
