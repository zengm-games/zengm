// @flow

import { g } from "../../../common";
import { draft } from "../../core";
import { idb } from "../../db";

const newPhaseAfterDraft = async () => {
    await draft.genPicks(g.season + 4);

    // Delete any old draft picks
    const draftPicks = await idb.cache.draftPicks.getAll();
    for (const dp of draftPicks) {
        if (dp.season <= g.season) {
            await idb.cache.draftPicks.delete(dp.dpid);
        }
    }

    return [undefined, ["playerMovement"]];
};

export default newPhaseAfterDraft;
