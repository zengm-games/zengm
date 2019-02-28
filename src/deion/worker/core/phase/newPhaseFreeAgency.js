// @flow

import { PHASE, PLAYER } from "../../../common";
import { contractNegotiation, draft, player } from "..";
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

    // Bump up future draft classes (not simultaneous so tid updates don't cause race conditions)
    const players3 = await idb.cache.players.indexGetAll(
        "playersByTid",
        PLAYER.UNDRAFTED_2,
    );
    for (const p of players3) {
        p.tid = PLAYER.UNDRAFTED;
        p.ratings[0].fuzz /= Math.sqrt(2);
        player.develop(p, 0); // Update skills/pot based on fuzz
        player.updateValues(p);
        await idb.cache.players.put(p);
    }
    const players4 = await idb.cache.players.indexGetAll(
        "playersByTid",
        PLAYER.UNDRAFTED_3,
    );
    for (const p of players4) {
        p.tid = PLAYER.UNDRAFTED_2;
        p.ratings[0].fuzz /= Math.sqrt(2);
        player.develop(p, 0); // Update skills/pot based on fuzz
        player.updateValues(p);
        await idb.cache.players.put(p);
    }
    await draft.genPlayers(PLAYER.UNDRAFTED_3);

    return [helpers.leagueUrl(["free_agents"]), ["playerMovement"]];
};

export default newPhaseFreeAgency;
