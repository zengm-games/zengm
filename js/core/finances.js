/**
 * @name core.finances
 * @namespace Anything related to budget/finances.
 */
define(["db", "globals"], function (db, g) {
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
            tx = g.dbl.transaction(["teams"], "readwrite");
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

    return {
        assesPayrollMinLuxury: assesPayrollMinLuxury
    };
});