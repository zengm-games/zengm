// @flow

import { idb } from "../../db";
import type { ContractInfo } from "../../../common/types";

/**
 * Gets all the contracts a team owes.
 *
 * This includes contracts for players who have been released but are still owed money.
 *
 * @memberOf core.team
 * @param {number} tid Team ID.
 * @returns {Promise.Array} Array of objects containing contract information.
 */
const getContracts = async (tid: number): Promise<ContractInfo[]> => {
    // First, get players currently on the roster
    // $FlowFixMe
    const players = await idb.cache.players.indexGetAll("playersByTid", tid);

    const contracts = players.map(p => {
        return {
            pid: p.pid,
            firstName: p.firstName,
            lastName: p.lastName,
            skills: p.ratings[p.ratings.length - 1].skills,
            pos: p.ratings[p.ratings.length - 1].pos,
            injury: p.injury,
            watch: p.watch,
            amount: p.contract.amount,
            exp: p.contract.exp,
            released: false,
        };
    });

    // Then, get any released players still owed money
    const releasedPlayers = await idb.cache.releasedPlayers.indexGetAll(
        "releasedPlayersByTid",
        tid,
    );

    for (const releasedPlayer of releasedPlayers) {
        const p = await idb.getCopy.players({ pid: releasedPlayer.pid });
        if (p !== undefined) {
            // If a player is deleted, such as if the user deletes retired players, this will be undefined
            contracts.push({
                pid: releasedPlayer.pid,
                firstName: p.firstName,
                lastName: p.lastName,
                skills: p.ratings[p.ratings.length - 1].skills,
                pos: p.ratings[p.ratings.length - 1].pos,
                injury: p.injury,
                watch: p.watch !== undefined ? p.watch : false, // undefined check is for old leagues, can delete eventually
                amount: releasedPlayer.contract.amount,
                exp: releasedPlayer.contract.exp,
                released: true,
            });
        } else {
            contracts.push({
                pid: releasedPlayer.pid,
                firstName: "Deleted",
                lastName: "Player",
                skills: [],
                injury: { type: "Healthy", gamesRemaining: 0 },
                watch: false,
                amount: releasedPlayer.contract.amount,
                exp: releasedPlayer.contract.exp,
                released: true,
            });
        }
    }

    return contracts;
};

export default getContracts;
