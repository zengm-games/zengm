/*
util.lock

These functions all deal with locking game state when there is some blocking
action in progress, currently one of these things:

* Game simulation is in progress
* User is negotiating a contract

There are also functions to check if it is permissible to start one of those
actions.
*/
define(["util/helpers"], function (helpers) {
    "use strict";

    function setGamesInProgress(status) {
        if (status) {
            status = true;
        } else {
            status = false;
        }
        helpers.setGameAttributes({gamesInProgress: status});
    }

    function gamesInProgress() {
        return g.gamesInProgress;
    }

    /*Returns true or false depending on whether the negotiations table is
    empty or not.*/
    function negotiationInProgress() {
        var negotiations;

        negotiations = JSON.parse(localStorage.getItem("league" + g.lid + "Negotiations"));
        if (negotiations.length > 0) {
            return true;
        }
        return false;
    }

    /*Returns a boolean. Games can be started only when there is no contract
    negotiation in progress and there is no other game simulation in progress.
    */
    function canStartGames() {
/*        r = g.dbex('SELECT games_in_progress FROM game_attributes')
        games_in_progress, = r.fetchone()

        if games_in_progress or negotiation_in_progress():
            return false;
        else {
            return true;
        }

        can_start_negotiation: function () {
        r = g.dbex('SELECT games_in_progress FROM game_attributes')
        games_in_progress, = r.fetchone()

        if games_in_progress:
            return false;

        // Allow multiple parallel negotiations (ignore negotiation_in_progress) only for resigning players
        r = g.dbex('SELECT 1 FROM negotiations WHERE resigning = false')
        if r.rowcount:
            return false;*/

        return true;
    }

    function canStartNegotiation() {
        var i, negotiations;

        if (g.gamesInProgress) {
            return false;
        }

        // Allow multiple parallel negotiations only for resigning players
        negotiations = JSON.parse(localStorage.getItem("league" + g.lid + "Negotiations"));
        for (i = 0; i < negotiations.length; i++) {
            if (!negotiations[i].resigning) {
                return false;
            }
        }

        return true;
    }

    return {
        set_games_in_progress: setGamesInProgress,
        games_in_progress: gamesInProgress,
        negotiationInProgress: negotiationInProgress,
        can_start_games: canStartGames,
        canStartNegotiation: canStartNegotiation
    };
});
