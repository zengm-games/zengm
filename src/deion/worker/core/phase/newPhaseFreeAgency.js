// @flow

import { PHASE, PLAYER } from "../../../common";
import { contractNegotiation, player } from "..";
import { idb } from "../../db";
import { helpers } from "../../util";

const newPhaseFreeAgency = async () => {
    // Delete all current negotiations to resign players
    await contractNegotiation.cancelAll();

    const baseMoods = await player.genBaseMoods();

    // Reset contract demands of current free agents and undrafted players
    // KeyRange only works because PLAYER.UNDRAFTED is -2 and PLAYER.FREE_AGENT is -1
    const players = await idb.cache.players.indexGetAll("playersByTid", [
        PLAYER.UNDRAFTED,
        PLAYER.FREE_AGENT,
    ]);
    for (const p of players) {
        player.addToFreeAgents(p, PHASE.FREE_AGENCY, baseMoods);
        await idb.cache.players.put(p);
    }

    return [helpers.leagueUrl(["free_agents"]), ["playerMovement"]];
};

export default newPhaseFreeAgency;
