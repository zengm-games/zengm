'use strict';

var g = require('../globals');
var helpers = require('../util/helpers');

/**
 * Is game simulation in progress?
 *
 * Calls the callback function with either true or false depending on whether there is a game simulation currently in progress.
 *
 * @memberOf util.lock
 * @param {IDBObjectStore|IDBTransaction|null} ot An IndexedDB object store or transaction on gameAttributes; if null is passed, then a new transaction will be used.
 * @return {Promise.boolean}
 */
function gamesInProgress(ot) {
    return require('../core/league').loadGameAttribute(ot, "gamesInProgress").then(function () {
        return g.gamesInProgress;
    });
}

/**
 * Is a negotiation in progress?
 *
 * Calls the callback function with either true or false depending on whether there is an ongoing negoation.
 *
 * @memberOf util.lock
 * @param {IDBObjectStore|IDBTransaction|null} ot An IndexedDB object store or transaction on negotiations; if null is passed, then a new transaction will be used.
 * @return {Promise.boolean}
 */
function negotiationInProgress(ot) {
    var dbOrTx = ot !== null ? ot : g.dbl;
    return dbOrTx.negotiations.getAll().then(function (negotiations) {
        if (negotiations.length > 0) {
            return true;
        }
        return false;
    });
}

/**
 * Is a phase change in progress?
 *
 * @memberOf util.lock
 * @param {IDBObjectStore|IDBTransaction|null} ot An IndexedDB object store or transaction on gameAttributes; if null is passed, then a new transaction will be used.
 * @return {Promise.boolean}
 */
function phaseChangeInProgress(ot) {
    return require('../core/league').loadGameAttribute(ot, "phaseChangeInProgress").then(function () {
        return g.phaseChangeInProgress;
    });
}

/**
 * Can new game simulations be started?
 *
 * Calls the callback function with either true or false. If games are in progress or any contract negotiation is in progress, false.
 *
 * @memberOf util.lock
 * @param {IDBObjectStore|IDBTransaction|null} ot An IndexedDB object store or transaction on gameAttributes and negotiations; if null is passed, then a new transaction will be used.
 * @return {Promise.boolean}
 */
function canStartGames(ot) {
    return helpers.maybeReuseTx(["gameAttributes", "negotiations"], "readonly", ot, function (tx) {
        return gamesInProgress(tx).then(function (gamesInProgressBool) {
            if (gamesInProgressBool) {
                return false;
            }

            return negotiationInProgress(tx).then(function (negotiationInProgressBool) {
                if (negotiationInProgressBool) {
                    return false;
                }

                return phaseChangeInProgress(tx).then(function (phaseChangeInProgressBool) {
                    if (phaseChangeInProgressBool) {
                        return false;
                    }

                    return true;
                });
            });
        });
    });
}

/**
 * Can a new contract negotiation be started?
 *
 * Calls the callback function with either true or false. If games are in progress or a free agent (not re-signing!) is being negotiated with, false.
 *
 * @memberOf util.lock
 * @param {IDBObjectStore|IDBTransaction|null} ot An IndexedDB object store or transaction on gameAttributes and negotiations; if null is passed, then a new transaction will be used.
 * @return {Promise.boolean}
 */
function canStartNegotiation(ot) {
    return helpers.maybeReuseTx(["gameAttributes", "negotiations"], "readonly", ot, function (tx) {
        return gamesInProgress(tx).then(function (gamesInProgressBool) {
            if (gamesInProgressBool) {
                return false;
            }

            // Allow multiple parallel negotiations only for re-signing players
            return tx.negotiations.getAll().then(function (negotiations) {
                var i;

                for (i = 0; i < negotiations.length; i++) {
                    if (!negotiations[i].resigning) {
                        return false;
                    }
                }

                return true;

                // Don't also check phase change because negotiations are auto-started in phase change
            });
        });
    });
}

/**
 * Is there an undread message from the owner?
 *
 * Calls the callback function with either true or false.
 *
 * @memberOf util.lock
 * @param {IDBObjectStore|IDBTransaction|null} ot An IndexedDB object store or transaction on messages; if null is passed, then a new transaction will be used.
 * @return {Promise.boolean}
 */
function unreadMessage(ot) {
    var dbOrTx = ot !== null ? ot : g.dbl;
    return dbOrTx.messages.getAll().then(function (messages) {
        var i;

        for (i = 0; i < messages.length; i++) {
            if (!messages[i].read) {
                return true;
            }
        }

        return false;
    });
}

module.exports = {
    gamesInProgress: gamesInProgress,
    negotiationInProgress: negotiationInProgress,
    phaseChangeInProgress: phaseChangeInProgress,
    canStartGames: canStartGames,
    canStartNegotiation: canStartNegotiation,
    unreadMessage: unreadMessage
};

