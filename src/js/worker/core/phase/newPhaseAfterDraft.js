// @flow

import { draft } from "..";
import { idb } from "../../db";
import { g } from "../../util";

const newPhaseAfterDraft = async () => {
    await draft.genPicks(g.season + 4);

    // Delete any old draft picks
    const draftPicks = await idb.cache.draftPicks.getAll();
    for (const dp of draftPicks) {
        if (typeof dp.season !== "number" || dp.season <= g.season) {
            await idb.cache.draftPicks.delete(dp.dpid);
        }
    }

    return [undefined, ["playerMovement"]];
};

export default newPhaseAfterDraft;
