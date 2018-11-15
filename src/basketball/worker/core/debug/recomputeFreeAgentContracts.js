// @flow

import { PHASE, PLAYER } from "../../../common";
import { player } from "..";
import { idb } from "../../db";
import { toUI } from "../../util";

const recomputeFreeAgentContracts = async () => {
    const players = await idb.cache.players.indexGetAll(
        "playersByTid",
        PLAYER.FREE_AGENT,
    );

    const baseMoods = await player.genBaseMoods();
    for (const p of players) {
        player.addToFreeAgents(p, PHASE.FREE_AGENCY, baseMoods);
        await idb.cache.players.put(p);
    }

    await toUI(["realtimeUpdate", ["playerMovement"]]);
};

export default recomputeFreeAgentContracts;
