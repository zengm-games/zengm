// @flow

import { g, PHASE_TEXT } from "../../common";
import { idb } from "../db";
import { local, toUI } from "../util";
import type { Conditions } from "../../common/types";

/*Save phase text to database and push to client.

If no phase text is given, load the last phase text from the database and
push that to the client.

Pass conditions only if you want to force update a single tab (like beforeView).

Args:
    phaseText: A string containing the current phase text to be pushed to
        the client.
*/
async function updatePhase(conditions?: Conditions) {
    const phaseText = `${g.season} ${PHASE_TEXT[g.phase]}`;
    if (phaseText !== local.phaseText) {
        local.phaseText = phaseText;
        toUI(["emit", "updateTopMenu", { phaseText }]);

        // Update phase in meta database. No need to have this block updating the UI or anything.
        (async () => {
            if (idb.meta) {
                const l = await idb.meta.leagues.get(g.lid);
                l.phaseText = phaseText;
                await idb.meta.leagues.put(l);
            }
        })();
    } else if (conditions !== undefined) {
        toUI(["emit", "updateTopMenu", { phaseText }], conditions);
    }
}

export default updatePhase;
