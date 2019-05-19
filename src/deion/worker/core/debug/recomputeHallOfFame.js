// @flow

import { idb } from "../../db";
import { overrides, toUI } from "../../util";

const recomputeFreeAgentContracts = async () => {
    await idb.league.tx("players", "readwrite", async tx => {
        await tx.players.iterate(p => {
            if (!overrides.core.player.madeHof) {
                throw new Error("Missing overrides.core.player.madeHof");
            }
            const madeHof = overrides.core.player.madeHof(p);
            if (p.hof !== madeHof) {
                p.hof = madeHof;
                return p;
            }
        });
    });

    await idb.cache.fill();

    await toUI(["realtimeUpdate", ["firstRun"]]);
};

export default recomputeFreeAgentContracts;
