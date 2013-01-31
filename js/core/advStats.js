/**
 * @name core.advStats
 * @namespace Advanced stats (PER, WS, etc) that require some nontrivial calculation and thus are calculated and cached once each day.
 */
define(["db"], function (db) {
    "use strict";

    /**
     * Calcualte the current season's Player Efficiency Rating (PER) for each active player and write it to the database.
     *
     * This is based on http://www.basketball-reference.com/about/per.html
     *
     * @memberOf core.advStats
     */
    function calculatePER() {
        // Total league stats (not per game averages) - ft, pf, ast, fg, pts, fga, orb, tov, fta, trb

        // Total team stats (not per game averages) - ast, fg

        // Calculate pace for each team, using the "estimated pace adjustment" formula rather than the "pace adjustment" formula because it's simpler and ends up at nearly the same result.

        // Total player stats (not per game averages) - min, tp, ast, fg, ft, tov, fga, fta, trb, orb, stl, blk, pf

        // uPER

        // aPER

        // PER
    }

    function calculateWS() {

    }

    function calculateAll() {
        calculatePER();
        calculateWS();
    }

    return {
        calculateAll: calculateAll
    };
});