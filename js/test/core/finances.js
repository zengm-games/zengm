/**
 * @name test.core.league
 * @namespace Tests for core.league.
 */
define(["db", "globals", "core/league", "core/finances"], function (db, g, league, finances) {
    "use strict";

    describe("core/finances", function () {
        var testDraftUntilUserOrEnd, testDraftUser;

        before(function (done) {
            db.connectMeta(function () {
                league.create("Test", 0, "random", function () {
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

                        for (i = 0; i < 30; i++) {
                            teams[i].seasons[0].payrollEndOfSeason.should.be.above(0);

                            if (teams[i].seasons[0].payrollEndOfSeason > g.luxuryPayroll) {
                                teams[i].seasons[0].luxuryTaxPaid.should.equal(g.luxuryTax * (teams[i].seasons[0].payrollEndOfSeason - g.luxuryPayroll));
                            } else {
                                teams[i].seasons[0].luxuryTaxPaid.should.equal(0);
                            }

                            if (teams[i].seasons[0].payrollEndOfSeason < g.minPayroll) {
                                teams[i].seasons[0].minTaxPaid.should.equal(g.minPayroll - teams[i].seasons[0].payrollEndOfSeason);
                            } else {
                                teams[i].seasons[0].minTaxPaid.should.equal(0);
                            }
                        }

                        done();
                    };
                });
            });
        });
    });
});