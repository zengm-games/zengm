// @flow

import backboard from "backboard";
import { PLAYER } from "../../../common";
import { player } from "..";
import { idb } from "../../db";

const countSkills = async () => {
    // All non-retired players
    const players = await idb.league.players
        .index("tid")
        .getAll(backboard.lowerBound(PLAYER.FREE_AGENT));

    const counts = {
        "3": 0,
        A: 0,
        B: 0,
        Di: 0,
        Dp: 0,
        Po: 0,
        Ps: 0,
        R: 0,
    };

    for (const p of players) {
        const r = p.ratings[p.ratings.length - 1];

        // Dynamically recompute, to make dev easier when changing skills formula
        const skills = player.skills(r);

        for (const skill of skills) {
            counts[skill] += 1;
        }
    }

    console.table(counts);
};

export default countSkills;
