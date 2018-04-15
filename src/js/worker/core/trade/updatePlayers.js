// @flow

import { idb } from "../../db";
import type { TradeTeams } from "../../../common/types";
import isUntradable from "./isUntradable";

/**
 * Validates that players are allowed to be traded and updates the database.
 *
 * If any of the player IDs submitted do not correspond with the two teams that are trading, they will be ignored.
 *
 * @memberOf core.trade
 * @param {Array.<Object>} teams Array of objects containing the assets for the two teams in the trade. The first object is for the user's team and the second is for the other team. Values in the objects are tid (team ID), pids (player IDs) and dpids (draft pick IDs).
 * @return {Promise.<Array.<Object>>} Resolves to an array taht's the same as the input, but with invalid entries removed.
 */
const updatePlayers = async (teams: TradeTeams): Promise<TradeTeams> => {
    // Make sure each entry in teams has pids and dpids that actually correspond to the correct tid
    for (const t of teams) {
        // Check players
        const players = await idb.getCopies.players({ tid: t.tid });
        const pidsGood = [];
        for (const p of players) {
            // Also, make sure player is not untradable
            if (t.pids.includes(p.pid) && !isUntradable(p)) {
                pidsGood.push(p.pid);
            }
        }
        t.pids = pidsGood;

        // Check draft picks
        const draftPicks = await idb.cache.draftPicks.indexGetAll(
            "draftPicksByTid",
            t.tid,
        );
        const dpidsGood = [];
        for (const dp of draftPicks) {
            if (t.dpids.includes(dp.dpid)) {
                dpidsGood.push(dp.dpid);
            }
        }
        t.dpids = dpidsGood;
    }

    let updated = false; // Has the trade actually changed?

    const tr = await idb.cache.trade.get(0);
    for (let i = 0; i < 2; i++) {
        if (teams[i].tid !== tr.teams[i].tid) {
            updated = true;
            break;
        }
        if (teams[i].pids.toString() !== tr.teams[i].pids.toString()) {
            updated = true;
            break;
        }
        if (teams[i].dpids.toString() !== tr.teams[i].dpids.toString()) {
            updated = true;
            break;
        }
    }

    if (updated) {
        tr.teams = teams;
        await idb.cache.trade.put(tr);
    }

    return teams;
};

export default updatePlayers;
