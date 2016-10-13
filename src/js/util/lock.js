import g from '../globals';
import * as league from '../core/league';
import * as helpers from './helpers';

/**
 * Is game simulation in progress?
 *
 * Calls the callback function with either true or false depending on whether there is a game simulation currently in progress.
 *
 * @memberOf util.lock
 * @param {IDBTransaction|null} ot An IndexedDB transaction on gameAttributes; if null is passed, then a new transaction will be used.
 * @return {Promise.boolean}
 */
async function gamesInProgress(ot) {
    await league.loadGameAttribute(ot, "gamesInProgress");
    return g.gamesInProgress;
}

/**
 * Is a negotiation in progress?
 *
 * Calls the callback function with either true or false depending on whether there is an ongoing negoation.
 *
 * @memberOf util.lock
 * @param {IDBTransaction|null} ot An IndexedDB transaction on negotiations; if null is passed, then a new transaction will be used.
 * @return {Promise.boolean}
 */
async function negotiationInProgress(ot) {
    const dbOrTx = ot !== null ? ot : g.dbl;
    const negotiations = await dbOrTx.negotiations.getAll();
    return negotiations.length > 0;
}

/**
 * Is a phase change in progress?
 *
 * @memberOf util.lock
 * @param {IDBTransaction|null} ot An IndexedDB transaction on gameAttributes; if null is passed, then a new transaction will be used.
 * @return {Promise.boolean}
 */
async function phaseChangeInProgress(ot) {
    await league.loadGameAttribute(ot, "phaseChangeInProgress");
    return g.phaseChangeInProgress;
}

/**
 * Can new game simulations be started?
 *
 * Calls the callback function with either true or false. If games are in progress or any contract negotiation is in progress, false.
 *
 * @memberOf util.lock
 * @param {IDBTransaction|null} ot An IndexedDB transaction on gameAttributes and negotiations; if null is passed, then a new transaction will be used.
 * @return {Promise.boolean}
 */
function canStartGames(ot) {
    return helpers.maybeReuseTx(["gameAttributes", "negotiations"], "readonly", ot, async tx => {
        const gamesInProgressBool = await gamesInProgress(tx);
        if (gamesInProgressBool) {
            return false;
        }

        const negotiationInProgressBool = await negotiationInProgress(tx);
        if (negotiationInProgressBool) {
            return false;
        }

        const phaseChangeInProgressBool = await phaseChangeInProgress(tx);
        if (phaseChangeInProgressBool) {
            return false;
        }

        return true;
    });
}

/**
 * Can a new contract negotiation be started?
 *
 * Calls the callback function with either true or false. If games are in progress or a free agent (not re-signing!) is being negotiated with, false.
 *
 * @memberOf util.lock
 * @param {IDBTransaction|null} ot An IndexedDB transaction on gameAttributes and negotiations; if null is passed, then a new transaction will be used.
 * @return {Promise.boolean}
 */
function canStartNegotiation(ot) {
    return helpers.maybeReuseTx(["gameAttributes", "negotiations"], "readonly", ot, async tx => {
        const gamesInProgressBool = await gamesInProgress(tx);
        if (gamesInProgressBool) {
            return false;
        }

        // Allow multiple parallel negotiations only for re-signing players
        const negotiations = await tx.negotiations.getAll();

        for (let i = 0; i < negotiations.length; i++) {
            if (!negotiations[i].resigning) {
                return false;
            }
        }

        return true;

        // Don't also check phase change because negotiations are auto-started in phase change
    });
}

/**
 * Is there an undread message from the owner?
 *
 * Calls the callback function with either true or false.
 *
 * @memberOf util.lock
 * @param {IDBTransaction|null} ot An IndexedDB transaction on messages; if null is passed, then a new transaction will be used.
 * @return {Promise.boolean}
 */
async function unreadMessage(ot) {
    const dbOrTx = ot !== null ? ot : g.dbl;
    const messages = await dbOrTx.messages.getAll();
    for (let i = 0; i < messages.length; i++) {
        if (!messages[i].read) {
            return true;
        }
    }
    return false;
}

export {
    gamesInProgress,
    negotiationInProgress,
    phaseChangeInProgress,
    canStartGames,
    canStartNegotiation,
    unreadMessage,
};

