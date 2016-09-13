import Promise from 'bluebird';
import g from '../globals';
import ui from '../ui';
import freeAgents from './freeAgents';
import league from './league';
import player from './player';
import team from './team';
import eventLog from '../util/eventLog';
import helpers from '../util/helpers';
import lock from '../util/lock';

/**
 * Start a new contract negotiation with a player.
 *
 * @memberOf core.contractNegotiation
 * @param {IDBTransaction} tx An IndexedDB transaction on gameAttributes, messages, negotiations, and players, readwrite.
 * @param {number} pid An integer that must correspond with the player ID of a free agent.
 * @param {boolean} resigning Set to true if this is a negotiation for a contract extension, which will allow multiple simultaneous negotiations. Set to false otherwise.
 * @param {number=} tid Team ID the contract negotiation is with. This only matters for Multi Team Mode. If undefined, defaults to g.userTid.
 * @return {Promise.<string=>)} If an error occurs, resolve to a string error message.
 */
async function create(tx, pid, resigning, tid = g.userTid) {
    if ((g.phase >= g.PHASE.AFTER_TRADE_DEADLINE && g.phase <= g.PHASE.RESIGN_PLAYERS) && !resigning) {
        return "You're not allowed to sign free agents now.";
    }

    const canStartNegotiation = await lock.canStartNegotiation(tx);
    if (!canStartNegotiation) {
        return "You cannot initiate a new negotiaion while game simulation is in progress or a previous contract negotiation is in process.";
    }

    const numPlayersOnRoster = await tx.players.index('tid').count(g.userTid);
    if (numPlayersOnRoster >= 15 && !resigning) {
        return "Your roster is full. Before you can sign a free agent, you'll have to release or trade away one of your current players.";
    }

    const p = await tx.players.get(pid);
    if (p.tid !== g.PLAYER.FREE_AGENT) {
        return `${p.firstName} ${p.lastName} is not a free agent.`;
    }

    // Initial player proposal;
    const playerAmount = freeAgents.amountWithMood(p.contract.amount, p.freeAgentMood[g.userTid]);
    let playerYears = p.contract.exp - g.season;
    // Adjust to account for in-season signings;
    if (g.phase <= g.PHASE.AFTER_TRADE_DEADLINE) {
        playerYears += 1;
    }

    if (freeAgents.refuseToNegotiate(playerAmount, p.freeAgentMood[g.userTid])) {
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

    await tx.negotiations.add(negotiation);
    league.updateLastDbChange();
    ui.updateStatus("Contract negotiation");
    return await ui.updatePlayMenu(tx);
}

/**
 * Cancel contract negotiations with a player.
 *
 * @memberOf core.contractNegotiation
 * @param {number} pid An integer that must correspond with the player ID of a player in an ongoing negotiation.
 * @return {Promise}
 */
async function cancel(pid) {
    await g.dbl.tx(["gameAttributes", "messages", "negotiations"], "readwrite", async tx => {
        await tx.negotiations.delete(pid);
        const negotiationInProgress = await lock.negotiationInProgress(tx);
        if (!negotiationInProgress) {
            if (g.phase === g.PHASE.FREE_AGENCY) {
                ui.updateStatus(`${g.daysLeft} days left`);
            } else {
                ui.updateStatus("Idle");
            }
            ui.updatePlayMenu(tx);
        }
    });

    league.updateLastDbChange();
}

/**
 * Cancel all ongoing contract negotiations.
 *
 * Currently, the only time there should be multiple ongoing negotiations in the first place is when a user is re-signing players at the end of the season, although that should probably change eventually.
 *
 * @memberOf core.contractNegotiation
 * @param {IDBTransaction} tx An IndexedDB transaction on gameAttributes, messages, and negotiations, readwrite.
 * @return {Promise}
 */
async function cancelAll(tx) {
    await tx.negotiations.clear();
    league.updateLastDbChange();
    ui.updateStatus("Idle");
    return await ui.updatePlayMenu(tx);
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
async function accept(pid, amount, exp) {
    const [negotiation, payroll] = await Promise.all([
        g.dbl.negotiations.get(pid),
        team.getPayroll(null, g.userTid).get(0),
    ]);

    // If this contract brings team over the salary cap, it's not a minimum;
    // contract, and it's not re-signing a current player, ERROR!
    if (!negotiation.resigning && (payroll + amount > g.salaryCap && amount > g.minContract)) {
        return "This contract would put you over the salary cap. You cannot go over the salary cap to sign free agents to contracts higher than the minimum salary. Either negotiate for a lower contract or cancel the negotiation.";
    }

    // This error is for sanity checking in multi team mode. Need to check for existence of negotiation.tid because it wasn't there originally and I didn't write upgrade code. Can safely get rid of it later.
    if (negotiation.tid !== undefined && negotiation.tid !== g.userTid) {
        return `This negotiation was started by the ${g.teamRegionsCache[negotiation.tid]} ${g.teamNamesCache[negotiation.tid]} but you are the ${g.teamRegionsCache[g.userTid]} ${g.teamNamesCache[g.userTid]}. Either switch teams or cancel this negotiation.`;
    }

    // Adjust to account for in-season signings;
    if (g.phase <= g.PHASE.AFTER_TRADE_DEADLINE) {
        negotiation.player.years -= 1;
    }

    await g.dbl.tx(["players", "playerStats"], "readwrite", async tx => {
        await tx.players.iterate(pid, p => {
            p.tid = g.userTid;
            p.gamesUntilTradable = 15;

            // Handle stats if the season is in progress
            if (g.phase <= g.PHASE.PLAYOFFS) { // Otherwise, not needed until next season
                p = player.addStatsRow(tx, p, g.phase === g.PHASE.PLAYOFFS);
            }

            p = player.setContract(p, {
                amount,
                exp,
            }, true);

            if (negotiation.resigning) {
                eventLog.add(null, {
                    type: "reSigned",
                    text: `The <a href="${helpers.leagueUrl(["roster", g.teamAbbrevsCache[g.userTid], g.season])}">${g.teamNamesCache[g.userTid]}</a> re-signed <a href="${helpers.leagueUrl(["player", p.pid])}">${p.firstName} ${p.lastName}</a> for ${helpers.formatCurrency(p.contract.amount / 1000, "M")}/year through ${p.contract.exp}.`,
                    showNotification: false,
                    pids: [p.pid],
                    tids: [g.userTid],
                });
            } else {
                eventLog.add(null, {
                    type: "freeAgent",
                    text: `The <a href="${helpers.leagueUrl(["roster", g.teamAbbrevsCache[g.userTid], g.season])}">${g.teamNamesCache[g.userTid]}</a> signed <a href="${helpers.leagueUrl(["player", p.pid])}">${p.firstName} ${p.lastName}</a> for ${helpers.formatCurrency(p.contract.amount / 1000, "M")}/year through ${p.contract.exp}.`,
                    showNotification: false,
                    pids: [p.pid],
                    tids: [g.userTid],
                });
            }

            return p;
        });
    });

    await cancel(pid);

    league.updateLastDbChange();
}

export default {
    accept,
    cancel,
    cancelAll,
    create,
};
