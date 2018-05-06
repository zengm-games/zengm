// @flow

import { g } from "../../../common";
import { idb } from "../../db";
import type { DraftPick } from "../../../common/types";

// Add a new set of draft picks
// existingDraftPicks should not be normally used, but sometimes a partial set of draft picks is saved to the database, in which case we want to merge those in with the newly generated ones.
const genPicks = async (
    season: number,
    existingDraftPicks?: DraftPick[] = [],
) => {
    for (let tid = 0; tid < g.numTeams; tid++) {
        for (let round = 1; round <= 2; round++) {
            // If a pick already exists in the database, no need to create it
            const existingDraftPick = existingDraftPicks.find(draftPick => {
                return (
                    tid === draftPick.originalTid &&
                    round === draftPick.round &&
                    season === draftPick.season
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
