// @flow

import { idb } from "../../db";
import { g } from "../../util";

const genOrderFantasy = async (tids: number[]) => {
    // Set total draft order, snaking picks each round
    for (let round = 1; round <= g.minRosterSize; round++) {
        for (let i = 0; i < tids.length; i++) {
            await idb.cache.draftPicks.add({
                tid: tids[i],
                originalTid: tids[i],
                round,
                pick: i + 1,
                season: "fantasy",
            });
        }

        tids.reverse(); // Snake
    }
};

export default genOrderFantasy;
