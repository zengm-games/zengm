// @flow

import { PHASE, PLAYER } from "../../../common";
import { idb } from "../../db";
import { g } from "../../util";

/**
 * Decrease contract demands for all free agents.
 *
 * This is called after each day in the regular season, as free agents become more willing to take smaller contracts.
 *
 * @memberOf core.freeAgents
 * @return {Promise}
 */
const decreaseDemands = async () => {
    const players = await idb.cache.players.indexGetAll(
        "playersByTid",
        PLAYER.FREE_AGENT,
    );
    for (const p of players) {
        // Decrease free agent demands
        p.contract.amount -= 50 * Math.sqrt(g.maxContract / 20000);
        p.contract.amount = 10 * Math.round(p.contract.amount / 10); // Round to nearest 10k
        if (p.contract.amount < g.minContract) {
            p.contract.amount = g.minContract;
        }

        if (g.phase !== PHASE.FREE_AGENCY) {
            // Since this is after the season has already started, ask for a short contract
            if (p.contract.amount < 1000) {
                p.contract.exp = g.season;
            } else {
                p.contract.exp = g.season + 1;
            }
        }

        // Free agents' resistance to signing decays after every regular season game
        for (let i = 0; i < p.freeAgentMood.length; i++) {
            p.freeAgentMood[i] -= 0.075;
            if (p.freeAgentMood[i] < 0) {
                p.freeAgentMood[i] = 0;
            }
        }

        // Also, heal.
        if (p.injury.gamesRemaining > 0) {
            p.injury.gamesRemaining -= 1;
        } else {
            p.injury = { type: "Healthy", gamesRemaining: 0 };
        }

        await idb.cache.players.put(p);
    }
};

export default decreaseDemands;
