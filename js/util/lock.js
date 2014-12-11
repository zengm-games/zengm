/**
 * @name util.lock
 * @namespace These functions all deal with locking game state when there is some blocking action in progress. Like don't allow game simulations when a trade is being negotiated. For figuring out the current state, trust only the database.
 */
define(["dao", "db", "globals"], function (dao, db, g) {
    "use strict";

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
        return db.loadGameAttribute(ot, "gamesInProgress").then(function () {
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
        return dao.negotiations.getAll({ot: ot}).then(function (negotiations) {
            if (negotiations.length > 0) {
                return true;
            }
            return false;
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
        return gamesInProgress(ot).then(function (gamesInProgressBool) {
            if (gamesInProgressBool) {
                return false;
            }

            return negotiationInProgress(ot).then(function (negotiationInProgressBool) {
                if (negotiationInProgressBool) {
                    return false;
                }

                return true;
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
        return gamesInProgress(ot).then(function (gamesInProgressBool) {
            if (gamesInProgressBool) {
                return false;
            }

            // Allow multiple parallel negotiations only for re-signing players
            dao.negotiations.getAll({ot: ot}).getAll().then(function (negotiations) {
                var i;

                for (i = 0; i < negotiations.length; i++) {
                    if (!negotiations[i].resigning) {
                        return false;
                    }
                }

                return true;
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
        return dao.messages.getAll({ot: ot}).then(function (messages) {
            var i;

            for (i = 0; i < messages.length; i++) {
                if (!messages[i].read) {
                    return true;
                }
            }

            return false;
        });
    }

    return {
        gamesInProgress: gamesInProgress,
        negotiationInProgress: negotiationInProgress,
        canStartGames: canStartGames,
        canStartNegotiation: canStartNegotiation,
        unreadMessage: unreadMessage
    };
});
