// @flow

import {PHASE, PLAYER, g, helpers} from '../../common';
import {freeAgents, player, team} from '../core';
import {idb} from '../db';
import {lock, logEvent, updatePlayMenu, updateStatus} from '../util';

/**
 * Start a new contract negotiation with a player.
 *
 * @memberOf core.contractNegotiation
 * @param {number} pid An integer that must correspond with the player ID of a free agent.
 * @param {boolean} resigning Set to true if this is a negotiation for a contract extension, which will allow multiple simultaneous negotiations. Set to false otherwise.
 * @param {number=} tid Team ID the contract negotiation is with. This only matters for Multi Team Mode. If undefined, defaults to g.userTid.
 * @return {Promise.<string=>)} If an error occurs, resolve to a string error message.
 */
async function create(pid: number, resigning: boolean, tid: number = g.userTid): Promise<string | void> {
    if ((g.phase >= PHASE.AFTER_TRADE_DEADLINE && g.phase <= PHASE.RESIGN_PLAYERS) && !resigning) {
        return "You're not allowed to sign free agents now.";
    }

    const canStartNegotiation = await lock.canStartNegotiation();
    if (!canStartNegotiation) {
        return "You cannot initiate a new negotiaion while game simulation is in progress or a previous contract negotiation is in process.";
    }

    const playersOnRoster = await idb.cache.players.indexGetAll('playersByTid', g.userTid);
    if (playersOnRoster.length >= 15 && !resigning) {
        return "Your roster is full. Before you can sign a free agent, you'll have to release or trade away one of your current players.";
    }

    const p = await idb.cache.players.get(pid);
    if (p.tid !== PLAYER.FREE_AGENT) {
        return `${p.firstName} ${p.lastName} is not a free agent.`;
    }

    // Initial player proposal;
    const playerAmount = freeAgents.amountWithMood(p.contract.amount, p.freeAgentMood[g.userTid]);
    let playerYears = p.contract.exp - g.season;
    // Adjust to account for in-season signings;
    if (g.phase <= PHASE.AFTER_TRADE_DEADLINE) {
        playerYears += 1;
    }

    if (helpers.refuseToNegotiate(playerAmount, p.freeAgentMood[g.userTid])) {
        return `<a href="${helpers.leagueUrl(["player", p.pid])}">${p.firstName} ${p.lastName}</a> refuses to sign with you, no matter what you offer.`;
    }

    const negotiation = {
        pid,
        tid,
        team: {amount: playerAmount, years: playerYears},
        player: {amount: playerAmount, years: playerYears},
        orig: {amount: playerAmount, years: playerYears},
        resigning,
    };

    await idb.cache.add('negotiations', negotiation);
    await updateStatus('Contract negotiation');
    await updatePlayMenu();
}

/**
 * Cancel contract negotiations with a player.
 */
async function cancel(pid: number) {
    await idb.cache.negotiations.delete(pid);
    const negotiationInProgress = await lock.negotiationInProgress();
    if (!negotiationInProgress) {
        if (g.phase === PHASE.FREE_AGENCY) {
            await updateStatus(`${g.daysLeft} days left`);
        } else {
            await updateStatus('Idle');
        }
        updatePlayMenu();
    }
}

/**
 * Cancel all ongoing contract negotiations.
 *
 * Currently, the only time there should be multiple ongoing negotiations in the first place is when a user is re-signing players at the end of the season, although that should probably change eventually.
 *
 * @memberOf core.contractNegotiation
 * @return {Promise}
 */
async function cancelAll() {
    await idb.cache.negotiations.clear();
    await updateStatus('Idle');
    return updatePlayMenu();
}

/**
 * Accept the player's offer.
 *
 * If successful, then the team's current roster will be displayed.
 *
 * @memberOf core.contractNegotiation
 * @param {number} pid An integer that must correspond with the player ID of a player in an ongoing negotiation.
 * @return {Promise.<string=>} If an error occurs, resolves to a string error message.
 */
async function accept(pid: number, amount: number, exp: number): Promise<?string> {
    const negotiation = await idb.cache.negotiations.get(pid);
    const payroll = (await team.getPayroll(g.userTid))[0];

    // If this contract brings team over the salary cap, it's not a minimum;
    // contract, and it's not re-signing a current player, ERROR!
    if (!negotiation.resigning && (payroll + amount > g.salaryCap && amount > g.minContract)) {
        return "This contract would put you over the salary cap. You cannot go over the salary cap to sign free agents to contracts higher than the minimum salary. Either negotiate for a lower contract or cancel the negotiation.";
    }

    // This error is for sanity checking in multi team mode. Need to check for existence of negotiation.tid because it wasn't there originally and I didn't write upgrade code. Can safely get rid of it later.
    if (negotiation.tid !== undefined && negotiation.tid !== g.userTid) {
        return `This negotiation was started by the ${g.teamRegionsCache[negotiation.tid]} ${g.teamNamesCache[negotiation.tid]} but you are the ${g.teamRegionsCache[g.userTid]} ${g.teamNamesCache[g.userTid]}. Either switch teams or cancel this negotiation.`;
    }

    const p = await idb.cache.players.get(pid);
    p.tid = g.userTid;
    p.gamesUntilTradable = 15;

    // Handle stats if the season is in progress
    if (g.phase <= PHASE.PLAYOFFS) { // Otherwise, not needed until next season
        await player.addStatsRow(p, g.phase === PHASE.PLAYOFFS);
    }

    player.setContract(p, {
        amount,
        exp,
    }, true);

    if (negotiation.resigning) {
        logEvent({
            type: "reSigned",
            text: `The <a href="${helpers.leagueUrl(["roster", g.teamAbbrevsCache[g.userTid], g.season])}">${g.teamNamesCache[g.userTid]}</a> re-signed <a href="${helpers.leagueUrl(["player", p.pid])}">${p.firstName} ${p.lastName}</a> for ${helpers.formatCurrency(p.contract.amount / 1000, "M")}/year through ${p.contract.exp}.`,
            showNotification: false,
            pids: [p.pid],
            tids: [g.userTid],
        });
    } else {
        logEvent({
            type: "freeAgent",
            text: `The <a href="${helpers.leagueUrl(["roster", g.teamAbbrevsCache[g.userTid], g.season])}">${g.teamNamesCache[g.userTid]}</a> signed <a href="${helpers.leagueUrl(["player", p.pid])}">${p.firstName} ${p.lastName}</a> for ${helpers.formatCurrency(p.contract.amount / 1000, "M")}/year through ${p.contract.exp}.`,
            showNotification: false,
            pids: [p.pid],
            tids: [g.userTid],
        });
    }

    await idb.cache.put('players', p);
    idb.cache.markDirtyIndexes('players');

    await cancel(pid);
}

export default {
    accept,
    cancel,
    cancelAll,
    create,
};
