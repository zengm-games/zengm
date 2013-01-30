/*
util.lock

These functions all deal with locking game state when there is some blocking
action in progress, currently one of these things:

* Game simulation is in progress
* User is negotiating a contract

There are also functions to check if it is permissible to start one of those
actions.
*/
define(["db"], function (db) {
    "use strict";

    function setGamesInProgress(status, cb) {
        if (status) {
            status = true;
        } else {
            status = false;
        }
        db.setGameAttributes({gamesInProgress: status}, cb);
    }

    /**
     * Is game simulation in progress?
     *
     * Calls the callback function with either true or false depending on whether there is a game simulation currently in progress.
     * 
     * @memberOf lock
     * @param {IDBObjectStore|IDBTransaction|null} ot An IndexedDB object store or transaction on gameAttributes; if null is passed, then a new transaction will be used.
     * @param {function(boolean)} cb Callback.
     */
    function gamesInProgress(ot, cb) {
        db.loadGameAttribute(ot, "gamesInProgress", function () {
            cb(g.gamesInProgress);
        });
    }

    /**
     * Is a negotiation in progress?
     *
     * Calls the callback function with either true or false depending on whether there is an ongoing negoation.
     * 
     * @memberOf lock
     * @param {IDBObjectStore|IDBTransaction|null} ot An IndexedDB object store or transaction on negotiations; if null is passed, then a new transaction will be used.
     * @param {function(boolean)} cb Callback.
     */
    function negotiationInProgress(ot, cb) {
        var negotiationStore;

        negotiationStore = db.getObjectStore(ot, "negotiations", "negotiations");
        negotiationStore.getAll().onsuccess = function (event) {
            var negotiations;

            negotiations = event.target.result;

            if (negotiations.length > 0) {
                return cb(true);
            }
            return cb(false);
        };
    }

    /**
     * Can new game simulations be started?
     *
     * Calls the callback function with either true or false. If games are in progress or any contract negotiation is in progress, false.
     *
     * @memberOf lock
     * @param {IDBObjectStore|IDBTransaction|null} ot An IndexedDB object store or transaction on gameAttributes and negotiations; if null is passed, then a new transaction will be used.
     * @param {function(boolean)} cb Callback.
     */
    function canStartGames(ot, cb) {
        gamesInProgress(ot, function (gamesInProgressBool) {
            if (gamesInProgressBool) {
                return cb(false);
            }

            negotiationInProgress(ot, function (negotiationInProgressBool) {
                if (negotiationInProgressBool) {
                    return cb(false);
                }

                return cb(true);
            });
        });
    }

    /**
     * Can a new contract negotiation be started?
     *
     * Calls the callback function with either true or false. If games are in progress or a free agent (not resigning!) is being negotiated with, false.
     * 
     * @memberOf lock
     * @param {IDBObjectStore|IDBTransaction|null} ot An IndexedDB object store or transaction on gameAttributes and negotiations; if null is passed, then a new transaction will be used.
     * @param {function(boolean)} cb Callback.
     */
    function canStartNegotiation(ot, cb) {
        gamesInProgress(ot, function (gamesInProgressBool) {
            if (gamesInProgressBool) {
                return cb(false);
            }

            // Allow multiple parallel negotiations only for resigning players
            db.getObjectStore(ot, "negotiations", "negotiations").getAll().onsuccess = function (event) {
                var i, negotiations;

                negotiations = event.target.result;

                for (i = 0; i < negotiations.length; i++) {
                    if (!negotiations[i].resigning) {
                        return cb(false);
                    }
                }

                return cb(true);
            };
        });
    }

    return {
        setGamesInProgress: setGamesInProgress,
        gamesInProgress: gamesInProgress,
        negotiationInProgress: negotiationInProgress,
        canStartGames: canStartGames,
        canStartNegotiation: canStartNegotiation
    };
});
