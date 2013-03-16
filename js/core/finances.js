/**
 * @name core.finances
 * @namespace Anything related to budget/finances.
 */
define(["db", "globals", "lib/underscore"], function (db, g, _) {
    "use strict";

    /**
     * Assess the payroll and apply minimum and luxury taxes.
     *
     * @memberOf core.finances
     * @param {function()} cb Callback function.
     */
    function assesPayrollMinLuxury(cb) {
        var i, getPayroll, payrolls, tx;

        db.getPayrolls(function (payrolls) {
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
     * Update the rankings of team budgets.
     *
     * This should be called after *any* team updates *any* budget item.
     *
     * @memberOf core.finances
     * @param {IDBTransaction} tx An IndexedDB object store or transaction on teams readwrite.
     * @param {function()} cb Callback function.
     */
    function updateBudgetRanks(tx, cb) {
        tx.objectStore("teams").getAll().onsuccess = function (event) {
            var budgetsByItem, budgetsByTeam, item, teams;

            teams = event.target.result;

            budgetsByTeam = _.pluck(teams, "budget");
            budgetsByItem = {};
            for (item in budgetsByTeam[0]) {
                if (budgetsByTeam[0].hasOwnProperty(item)) {
                    budgetsByItem[item] = _.pluck(budgetsByTeam, item);
                    budgetsByItem[item].sort(function (a, b) { return b.amount - a.amount; });
                }
            }

            tx.objectStore("teams").openCursor().onsuccess = function (event) {
                var cursor, i, item, t;

                cursor = event.target.result;

                if (cursor) {
                    t = cursor.value;

                    for (item in t.budget) {
                        if (t.budget.hasOwnProperty(item)) {
                            for (i = 0; i < budgetsByItem[item].length; i++) {
                                if (budgetsByItem[item][i].amount === t.budget[item].amount) {
                                    t.budget[item].rank = i + 1;
                                    break;
                                }
                            }
                        }
                    }

                    cursor.update(t);
                    cursor.continue();
                } else {
                    cb();
                }
            };
        };
    }

    function updateExpensesRevenuesRanks() {
        
    }

    return {
        assesPayrollMinLuxury: assesPayrollMinLuxury,
        updateBudgetRanks: updateBudgetRanks,
        updateExpensesRevenuesRanks: updateExpensesRevenuesRanks
    };
});