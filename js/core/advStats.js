/**
 * @name core.advStats
 * @namespace Advanced stats (PER, WS, etc) that require some nontrivial calculations and thus are calculated and cached once each day.
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
    function calculatePER(cb) {
        // Total team stats (not per game averages) - ast, fg, plus all the others needed for league totals
        var attributes, stats;

        attributes = ["tid"];
        stats = ["ft", "pf", "ast", "fg", "pts", "fga", "orb", "tov", "fta", "trb"];
        db.getTeams(null, g.season, attributes, stats, [], {totals: true}, function (teams) {
// TODO: add option for total stats to db.getTeams
console.log(teams);

            if (cb !== undefined) {
                cb();
            }
        });

        // Total league stats (not per game averages) - ft, pf, ast, fg, pts, fga, orb, tov, fta, trb

        // Calculate pace for each team, using the "estimated pace adjustment" formula rather than the "pace adjustment" formula because it's simpler and ends up at nearly the same result.

        // Total player stats (not per game averages) - min, tp, ast, fg, ft, tov, fga, fta, trb, orb, stl, blk, pf

        // uPER

        // aPER

        // PER

        // Where to save? new field in stats, or new object advStats? probably just in stats, right?
    }

    function calculateWS() {

    }

    function calculateAll(cb) {
        calculatePER(cb);
    }

    return {
        calculateAll: calculateAll
    };
});