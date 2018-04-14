// @flow

import { PHASE, PLAYER, g, helpers } from "../../../common";
import { contractNegotiation, league, player } from "../../core";
import { idb } from "../../db";
import { local, logEvent } from "../../util";
import type { Conditions } from "../../../common/types";

const newPhaseResignPlayers = async (conditions: Conditions) => {
    const baseMoods = await player.genBaseMoods();

    // Re-sign players on user's team, and some AI players
    const players = await idb.cache.players.indexGetAll("playersByTid", [
        PLAYER.FREE_AGENT,
        Infinity,
    ]);
    for (const p of players) {
        if (
            p.contract.exp <= g.season &&
            g.userTids.includes(p.tid) &&
            local.autoPlaySeasons === 0
        ) {
            const tid = p.tid;

            // Add to free agents first, to generate a contract demand, then open negotiations with player
            await player.addToFreeAgents(p, PHASE.RESIGN_PLAYERS, baseMoods);
            const error = await contractNegotiation.create(p.pid, true, tid);
            if (error !== undefined && error) {
                logEvent(
                    {
                        type: "refuseToSign",
                        text: error,
                        pids: [p.pid],
                        tids: [tid],
                    },
                    conditions,
                );
            }
        }
    }

    // Set daysLeft here because this is "basically" free agency, so some functions based on daysLeft need to treat it that way (such as the trade AI being more reluctant)
    await league.setGameAttributes({ daysLeft: 30 });

    return [helpers.leagueUrl(["negotiation"]), ["playerMovement"]];
};

export default newPhaseResignPlayers;
