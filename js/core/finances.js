/**
 * @name core.finances
 * @namespace Anything related to budget/finances.
 */
define(["globals", "lib/underscore"], function (g, _) {
    "use strict";

    /**
     * Assess the payroll and apply minimum and luxury taxes.
     *
     * @memberOf core.finances
     * @param {function()} cb Callback function.
     */
    function assesPayrollMinLuxury(cb) {
        var i, getPayroll, payrolls, tx;

        require("db").getPayrolls(function (payrolls) {
            var tx;

            // Update teams object store
            tx = g.dbl.transaction("teams", "readwrite");
            tx.objectStore("teams").openCursor().onsuccess = function (event) {
                var cursor, i, team;

                cursor = event.target.result;
                if (cursor) {
                    team = cursor.value;
                    i = team.seasons.length - 1;  // Relevant row is the last one

                    // Store payroll
                    team.seasons[i].payrollEndOfSeason = payrolls[team.tid];

                    // Assess minimum payroll tax and luxury tax
                    if (payrolls[team.tid] < g.minPayroll) {
                        team.seasons[i].expenses.minTax.amount = g.minPayroll - payrolls[team.tid];
                        team.seasons[i].cash -= team.seasons[i].expenses.minTax.amount;
                    } else if (payrolls[team.tid] > g.luxuryPayroll) {
                        team.seasons[i].expenses.luxuryTax.amount = g.luxuryTax * (payrolls[team.tid] - g.luxuryPayroll);
                        team.seasons[i].cash -= team.seasons[i].expenses.luxuryTax.amount;
                    }

                    cursor.update(team);
                    cursor.continue();
                }
            };
            tx.oncomplete = function () {
                cb();
            };
        });
    }

    /**
     * Update the rankings of team budgets, expenses, and revenue sources.
     *
     * Budget ranks should be updated after *any* team updates *any* budget item.
     * 
     * Revenue and expenses ranks should be updated any time any revenue or expense occurs - so basically, after every game.
     *
     * @memberOf core.finances
     * @param {IDBObjectStore|IDBTransaction|null} ot An IndexedDB object store or transaction on teams, readwrite; if null is passed, then a new transaction will be used.
     * @param {Array.<string>} type The types of ranks to update - some combination of "budget", "expenses", and "revenues"
     * @param {function()=} cb Optional callback function.
     */
    function updateRanks(ot, types, cb) {
        var getByItem, sortFn, teamStore, updateObj;

        sortFn = function (a, b) {
            return b.amount - a.amount;
        };

        getByItem = function (byTeam) {
            var byItem, item;
            byItem = {};
            for (item in byTeam[0]) {
                if (byTeam[0].hasOwnProperty(item)) {
                    byItem[item] = _.pluck(byTeam, item);
                    byItem[item].sort(sortFn);
                }
            }
            return byItem;
        };

        updateObj = function (obj, byItem) {
            var i, item;
            for (item in obj) {
                if (obj.hasOwnProperty(item)) {
                    for (i = 0; i < byItem[item].length; i++) {
                        if (byItem[item][i].amount === obj[item].amount) {
                            obj[item].rank = i + 1;
                            break;
                        }
                    }
                }
            }
        };

        teamStore = require("db").getObjectStore(ot, "teams", "teams", true);

        teamStore.getAll().onsuccess = function (event) {
            var budgetsByItem, budgetsByTeam, expensesByItem, expensesByTeam, i, revenuesByItem, revenuesByTeam, s, teams;

            teams = event.target.result;

            if (types.indexOf("budget") >= 0) {
                budgetsByTeam = _.pluck(teams, "budget");
                budgetsByItem = getByItem(budgetsByTeam);
            }
            if (types.indexOf("expenses") >= 0) {
                s = teams[0].seasons.length - 1;
                expensesByTeam = [];
                for (i = 0; i < teams.length; i++) {
                    expensesByTeam[i] = teams[i].seasons[s].expenses;
                }
                expensesByItem = getByItem(expensesByTeam);
            }
            if (types.indexOf("revenues") >= 0) {
                s = teams[0].seasons.length - 1;
                revenuesByTeam = [];
                for (i = 0; i < teams.length; i++) {
                    revenuesByTeam[i] = teams[i].seasons[s].revenues;
                }
                revenuesByItem = getByItem(revenuesByTeam);
            }

            teamStore.openCursor().onsuccess = function (event) {
                var cursor, i, item, t;

                cursor = event.target.result;

                if (cursor) {
                    t = cursor.value;

                    if (types.indexOf("budget") >= 0) {
                        updateObj(t.budget, budgetsByItem);
                    }
                    if (types.indexOf("expenses") >= 0) {
                        updateObj(t.seasons[s].expenses, expensesByItem);
                    }
                    if (types.indexOf("revenues") >= 0) {
                        updateObj(t.seasons[s].revenues, revenuesByItem);
                    }

                    cursor.update(t);
                    cursor.continue();
                } else if (cb !== undefined) {
                    cb();
                }
            };
        };
    }

    /**
     * Gets the rank of some financial thing over the past 3 seasons, if available.
     *
     * If only 1 or 2 seasons are available, assume 15.5 (average) for the other seasons
     *
     * @memberOf core.finances
     * @param {Object} t Team object
     * @param {string} category Currently either "expenses" or "revenues", but could be extended to allow "budget" if needed.
     * @param {string} item Item inside the category
     * @return {number} Rank, from 1 to 30
     */
    function getRankLastThree(t, category, item) {
        var s;

console.log(t);
if (t === undefined) {
    debugger;
}
        s = t.seasons.length - 1;  // Most recent season index
        if (s > 1) {
            // Use three seasons if possible
            return (t.seasons[s][category][item].rank + t.seasons[s - 1][category][item].rank + t.seasons[s - 2][category][item].rank) / 3;
        }
        if (s > 0) {
            // Use two seasons if possible
            return (t.seasons[s][category][item].rank + t.seasons[s - 1][category][item].rank + 15.5) / 3;
        }
        return (t.seasons[s][category][item].rank + 15.5 + 15.5) / 3;
    }

    return {
        assesPayrollMinLuxury: assesPayrollMinLuxury,
        updateRanks: updateRanks,
        getRankLastThree: getRankLastThree
    };
});