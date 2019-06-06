// @flow

import { PHASE, PLAYER } from "../../../common";
import { freeAgents } from "..";
import { idb } from "../../db";
import { g, helpers, lock, updatePlayMenu, updateStatus } from "../../util";

/**
 * Start a new contract negotiation with a player.
 *
 * @memberOf core.contractNegotiation
 * @param {number} pid An integer that must correspond with the player ID of a free agent.
 * @param {boolean} resigning Set to true if this is a negotiation for a contract extension, which will allow multiple simultaneous negotiations. Set to false otherwise.
 * @param {number=} tid Team ID the contract negotiation is with. This only matters for Multi Team Mode. If undefined, defaults to g.userTid.
 * @return {Promise.<string=>)} If an error occurs, resolve to a string error message.
 */
const create = async (
    pid: number,
    resigning: boolean,
    tid: number = g.userTid,
    rookie?: boolean = false,
): Promise<string | void> => {
    if (
        g.phase >= PHASE.AFTER_TRADE_DEADLINE &&
        g.phase <= PHASE.RESIGN_PLAYERS &&
        !resigning
    ) {
        return "You're not allowed to sign free agents now.";
    }

    if (lock.get("gameSim")) {
        return "You cannot initiate a new negotiaion while game simulation is in progress.";
    }

    const playersOnRoster = await idb.cache.players.indexGetAll(
        "playersByTid",
        g.userTid,
    );
    if (playersOnRoster.length >= g.maxRosterSize && !resigning) {
        return "Your roster is full. Before you can sign a free agent, you'll have to release or trade away one of your current players.";
    }

    const p = await idb.cache.players.get(pid);
    if (p.tid !== PLAYER.FREE_AGENT) {
        return `${p.firstName} ${p.lastName} is not a free agent.`;
    }

    if (
        !resigning &&
        helpers.refuseToNegotiate(
            freeAgents.amountWithMood(p.contract.amount, p.freeAgentMood[tid]),
            p.freeAgentMood[g.userTid],
            g.playersRefuseToNegotiate,
            rookie,
        )
    ) {
        return `<a href="${helpers.leagueUrl(["player", p.pid])}">${
            p.firstName
        } ${
            p.lastName
        }</a> refuses to sign with you, no matter what you offer.`;
    }

    const negotiation = {
        pid,
        tid,
        resigning,
    };

    // Except in re-signing phase, only one negotiation at a time
    if (!resigning) {
        await idb.cache.negotiations.clear();
    }

    await idb.cache.negotiations.add(negotiation);

    // This will be handled by phase change when re-signing
    if (!resigning) {
        await updateStatus("Contract negotiation");
        await updatePlayMenu();
    }
};

export default create;
