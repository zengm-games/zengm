// @flow

import { PHASE_TEXT } from "../../common";
import { idb } from "../db";
import g from "./g";
import local from "./local";
import toUI from "./toUI";
import type { Conditions } from "../../common/types";

// Calculate phase text in worker rather than UI, because here we can easily cache it in the meta database
async function updatePhase(conditions?: Conditions) {
    const phaseText = `${g.season} ${PHASE_TEXT[g.phase]}`;
    if (phaseText !== local.phaseText) {
        local.phaseText = phaseText;
        toUI(["updateLocal", { phaseText }]);

        // Update phase in meta database. No need to have this block updating the UI or anything.
        (async () => {
            if (idb.meta) {
                const l = await idb.meta.leagues.get(g.lid);
                l.phaseText = phaseText;
                await idb.meta.leagues.put(l);
            }
        })();
    } else if (conditions !== undefined) {
        toUI(["updateLocal", { phaseText }], conditions);
    }
}

export default updatePhase;
