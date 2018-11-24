// @flow

import range from "lodash/range";
import { idb } from "../../db";
import { g, random } from "../../util";

/**
 * Sets fantasy draft order and save it to the draftOrder object store.
 *
 * Randomize team order and then snake for 12 rounds.
 *
 * @memberOf core.draft
 * @return {Promise}
 */
const genOrderFantasy = async (position: number) => {
    // Randomly-ordered list of tids
    const tids = range(g.numTeams);
    random.shuffle(tids);
    if (position !== undefined && position >= 1 && position <= g.numTeams) {
        let i = 0;
        while (tids[position - 1] !== g.userTid && i < 1000) {
            random.shuffle(tids);
            i += 1;
        }
    }

    // Set total draft order: 12 rounds, snake
    for (let round = 1; round <= 12; round++) {
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
