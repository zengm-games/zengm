// @flow

import { idb } from "../../db";
import { g } from "../../util";
import type { DraftPick } from "../../../common/types";

// Add a new set of draft picks
// existingDraftPicks should not be normally used, but sometimes a partial set of draft picks is saved to the database, in which case we want to merge those in with the newly generated ones.
const genPicks = async (
    season: number,
    existingDraftPicks?: DraftPick[] = [],
) => {
    for (let round = 1; round <= g.numDraftRounds; round++) {
        for (let tid = 0; tid < g.numTeams; tid++) {
            // If a pick already exists in the database, no need to create it
            const existingDraftPick = existingDraftPicks.find(dp => {
                return (
                    tid === dp.originalTid &&
                    round === dp.round &&
                    season === dp.season
                );
            });
            if (!existingDraftPick) {
                await idb.cache.draftPicks.add({
                    tid,
                    originalTid: tid,
                    round,
                    pick: 0,
                    season,
                });
            }
        }
    }
};

export default genPicks;
