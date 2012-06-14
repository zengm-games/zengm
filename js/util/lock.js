/*
bbgm.util.lock

These functions all deal with locking game state when there is some blocking
action in progress, currently one of these things:

* Game simulation is in progress
* User is negotiating a contract

There are also functions to check if it is permissible to start one of those
actions.
*/
define([], function() {
    function setGamesInProgress(status) {
//        g.dbex('UPDATE game_attributes SET games_in_progress = :games_in_progress', games_in_progress=status)
    }

    function gamesInProgress() {
//        r = g.dbex('SELECT games_in_progress FROM game_attributes')
//        in_progress, = r.fetchone()
//        return in_progress
return false;
    }

    /*Returns true or false depending on whether the negotiations table is
    empty or not.*/
    function negotiationInProgress() {
//        r = g.dbex('SELECT 1 FROM negotiations')
//        if r.rowcount:
//            return true;
//        else {
            return false;
//        }
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

        return true
    }

    return {
        set_games_in_progress: setGamesInProgress,
        games_in_progress: gamesInProgress,
        negotiation_in_progress: negotiationInProgress,
        can_start_games: canStartGames
    };
});
