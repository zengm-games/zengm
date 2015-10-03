/**
 * @name core.finances
 * @namespace Anything related to budget/finances.
 */
'use strict';

var dao = require('../dao');
var g = require('../globals');
var _ = require('underscore');

/**
 * Assess the payroll and apply minimum and luxury taxes.
 * Distribute half of the collected luxury taxes to teams under the salary cap.
 *
 * @memberOf core.finances
 * @return {Promise}
 */
function assessPayrollMinLuxury(tx) {
    var amount, collectedTax, distribute;
    tx = dao.tx(["players", "releasedPlayers", "teams"], "readwrite", tx);
    collectedTax = 0;

    return require('./team').getPayrolls(tx).then(function (payrolls) {
        // Update teams object store
        return dao.teams.iterate({
            ot: tx,
            callback: function (t) {
                var s;

                s = t.seasons.length - 1; // Relevant row is the last one

                // Store payroll
                t.seasons[s].payrollEndOfSeason = payrolls[t.tid];

                // Assess minimum payroll tax and luxury tax
                if (payrolls[t.tid] < g.minPayroll) {
                    t.seasons[s].expenses.minTax.amount = g.minPayroll - payrolls[t.tid];
                    t.seasons[s].cash -= t.seasons[s].expenses.minTax.amount;
                } else if (payrolls[t.tid] > g.luxuryPayroll) {
                    amount = g.luxuryTax * (payrolls[t.tid] - g.luxuryPayroll);
                    collectedTax += amount;
                    t.seasons[s].expenses.luxuryTax.amount = amount;
                    t.seasons[s].cash -= t.seasons[s].expenses.luxuryTax.amount;
                }

                return t;
            }
        }).then(function () {
            var payteams;
            payteams = payrolls.filter(function (x) {
                return x <= g.salaryCap;
            });
            if (payteams.length > 0 && collectedTax > 0) {
                distribute = (collectedTax * 0.5) / payteams.length;
                return dao.teams.iterate({
                    ot: tx,
                    callback: function (t) {
                        var s;
                        s = t.seasons.length - 1;

                        if (payrolls[t.tid] <= g.salaryCap) {
                            t.seasons[s].revenues.luxuryTaxShare = {
                                amount: distribute,
                                rank: 15.5
                            };
                            t.seasons[s].cash += distribute;
                        } else {
                            t.seasons[s].revenues.luxuryTaxShare = {
                                amount: 0,
                                rank: 15.5
                            };
                        }
                        return t;
                    }
                });
            }
        });
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
 * @param {Promise}
 */
function updateRanks(ot, types) {
    var getByItem, sortFn, updateObj;

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

    return dao.teams.getAll({
        ot: ot
    }).then(function (teams) {
        var budgetsByItem, budgetsByTeam, expensesByItem, expensesByTeam, i, revenuesByItem, revenuesByTeam, s;

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

        return dao.teams.iterate({
            ot: ot,
            callback: function (t) {
                if (types.indexOf("budget") >= 0) {
                    updateObj(t.budget, budgetsByItem);
                }
                if (types.indexOf("expenses") >= 0) {
                    updateObj(t.seasons[s].expenses, expensesByItem);
                }
                if (types.indexOf("revenues") >= 0) {
                    updateObj(t.seasons[s].revenues, revenuesByItem);
                }

                return t;
            }
        });
    });
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
 * @return {number} Rank, from 1 to g.numTeams (default 30)
 */
function getRankLastThree(t, category, item) {
    var s;

    s = t.seasons.length - 1; // Most recent season index
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

module.exports = {
    assessPayrollMinLuxury: assessPayrollMinLuxury,
    updateRanks: updateRanks,
    getRankLastThree: getRankLastThree
};

