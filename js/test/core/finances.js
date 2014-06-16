/**
 * @name test.core.finances
 * @namespace Tests for core.finances.
 */
define(["db", "globals", "core/league", "core/finances"], function (db, g, league, finances) {
    "use strict";

    describe("core/finances", function () {
        before(function (done) {
            db.connectMeta(function () {
                league.create("Test", 0, undefined, 2013, false, function () {
                    done();
                });
            });
        });
        after(function (done) {
            league.remove(g.lid, done);
        });

        describe("#assesPayrollMinLuxury()", function () {
            it("should store payroll and appropriately assess luxury and minimum payroll taxes for each team", function (done) {
                finances.assesPayrollMinLuxury(function () {
                    g.dbl.transaction("teams").objectStore("teams").getAll().onsuccess = function (event) {
                        var i, teams;

                        teams = event.target.result;

                        for (i = 0; i < g.numTeams; i++) {
                            teams[i].seasons[0].payrollEndOfSeason.should.be.above(0);

                            if (teams[i].seasons[0].payrollEndOfSeason > g.luxuryPayroll) {
                                teams[i].seasons[0].expenses.luxuryTax.amount.should.equal(g.luxuryTax * (teams[i].seasons[0].payrollEndOfSeason - g.luxuryPayroll));
                            } else {
                                teams[i].seasons[0].expenses.luxuryTax.amount.should.equal(0);
                            }

                            if (teams[i].seasons[0].payrollEndOfSeason < g.minPayroll) {
                                teams[i].seasons[0].expenses.minTax.amount.should.equal(g.minPayroll - teams[i].seasons[0].payrollEndOfSeason);
                            } else {
                                teams[i].seasons[0].expenses.minTax.amount.should.equal(0);
                            }
                        }

                        done();
                    };
                });
            });
        });
    });
});