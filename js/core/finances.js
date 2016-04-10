/**
 * @name core.finances
 * @namespace Anything related to budget/finances.
 */
'use strict';

var g = require('../globals');
var _ = require('underscore');
var backboard = require('backboard');
var Promise = require('bluebird');

/**
 * Assess the payroll and apply minimum and luxury taxes.
 * Distribute half of the collected luxury taxes to teams under the salary cap.
 *
 * @memberOf core.finances
 * @return {Promise}
 */
function assessPayrollMinLuxury(tx) {
    var amount, collectedTax, distribute;
    collectedTax = 0;

    return require('./team').getPayrolls(tx).then(function (payrolls) {
        // Update teams object store
        return tx.teamSeasons.index("season, tid").iterate(backboard.bound([g.season], [g.season, '']), function (teamSeason) {
            // Store payroll
            teamSeason.payrollEndOfSeason = payrolls[teamSeason.tid];

            // Assess minimum payroll tax and luxury tax
            if (payrolls[teamSeason.tid] < g.minPayroll) {
                teamSeason.expenses.minTax.amount = g.minPayroll - payrolls[teamSeason.tid];
                teamSeason.cash -= teamSeason.expenses.minTax.amount;
            } else if (payrolls[teamSeason.tid] > g.luxuryPayroll) {
                amount = g.luxuryTax * (payrolls[teamSeason.tid] - g.luxuryPayroll);
                collectedTax += amount;
                teamSeason.expenses.luxuryTax.amount = amount;
                teamSeason.cash -= teamSeason.expenses.luxuryTax.amount;
            }

            return teamSeason;
        }).then(function () {
            var payteams;
            payteams = payrolls.filter(function (x) {
                return x <= g.salaryCap;
            });
            if (payteams.length > 0 && collectedTax > 0) {
                distribute = (collectedTax * 0.5) / payteams.length;
                return tx.teamSeasons.index("season, tid").iterate(backboard.bound([g.season], [g.season, '']), function (teamSeason) {
                    if (payrolls[teamSeason.tid] <= g.salaryCap) {
                        teamSeason.revenues.luxuryTaxShare = {
                            amount: distribute,
                            rank: 15.5
                        };
                        teamSeason.cash += distribute;
                    } else {
                        teamSeason.revenues.luxuryTaxShare = {
                            amount: 0,
                            rank: 15.5
                        };
                    }
                    return teamSeason;
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
 * @param {IDBTransaction} ot An IndexedDB transaction on teams, readwrite.
 * @param {Array.<string>} type The types of ranks to update - some combination of "budget", "expenses", and "revenues"
 * @param {Promise}
 */
function updateRanks(tx, types) {
    var getByItem, sortFn, teamSeasonsPromise, updateObj;

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

    if (types.indexOf("expenses") >= 0 || types.indexOf("revenues") >= 0) {
        teamSeasonsPromise = tx.teamSeasons.index("season, tid").getAll(backboard.bound([g.season], [g.season, '']));
    } else {
        teamSeasonsPromise = Promise.resolve();
    }

    return Promise.all([
        tx.teams.getAll(),
        teamSeasonsPromise
    ]).spread(function (teams, teamSeasons) {
        var budgetsByItem, budgetsByTeam, expensesByItem, expensesByTeam, i, revenuesByItem, revenuesByTeam;

        if (types.indexOf("budget") >= 0) {
            budgetsByTeam = _.pluck(teams, "budget");
            budgetsByItem = getByItem(budgetsByTeam);
        }
        if (types.indexOf("expenses") >= 0) {
            expensesByTeam = [];
            for (i = 0; i < teams.length; i++) {
                expensesByTeam[i] = teamSeasons[i].expenses;
            }
            expensesByItem = getByItem(expensesByTeam);
        }
        if (types.indexOf("revenues") >= 0) {
            revenuesByTeam = [];
            for (i = 0; i < teams.length; i++) {
                revenuesByTeam[i] = teamSeasons[i].revenues;
            }
            revenuesByItem = getByItem(revenuesByTeam);
        }

        return tx.teams.iterate(function (t) {
            if (types.indexOf("budget") >= 0) {
                updateObj(t.budget, budgetsByItem);
            }

            if (types.indexOf("revenues") >= 0) {
                updateObj(teamSeasons[t.tid].expenses, expensesByItem);
            }
            if (types.indexOf("expenses") >= 0) {
                updateObj(teamSeasons[t.tid].revenues, revenuesByItem);
            }

            return t;
        }).then(function () {
            if (types.indexOf("revenues") >= 0 || types.indexOf("expenses") >= 0) {
                return Promise.map(teamSeasons, function (teamSeason) {
                    return tx.teamSeasons.put(teamSeason);
                });
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
function getRankLastThree(teamSeasons, category, item) {
    var s;

    if (teamSeasons.hasOwnProperty('region')) {
        console.log('ERROR: getRankLastThree called with team object');
        return 15;
    }

    s = teamSeasons.length - 1; // Most recent season index
    if (s > 1) {
        // Use three seasons if possible
        return (teamSeasons[s][category][item].rank + teamSeasons[s - 1][category][item].rank + teamSeasons[s - 2][category][item].rank) / 3;
    }
    if (s > 0) {
        // Use two seasons if possible
        return (teamSeasons[s][category][item].rank + teamSeasons[s - 1][category][item].rank + 15.5) / 3;
    }
    return (teamSeasons[s][category][item].rank + 15.5 + 15.5) / 3;
}

module.exports = {
    assessPayrollMinLuxury: assessPayrollMinLuxury,
    updateRanks: updateRanks,
    getRankLastThree: getRankLastThree
};

