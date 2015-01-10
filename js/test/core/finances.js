/**
 * @name test.core.finances
 * @namespace Tests for core.finances.
 */
define(["dao", "db", "globals", "core/league", "core/finances"], function (dao, db, g, league, finances) {
    "use strict";

    describe("core/finances", function () {
        before(function () {
            return db.connectMeta().then(function () {
                return league.create("Test", 0, undefined, 2013, false);
            });
        });
        after(function () {
            return league.remove(g.lid);
        });

        describe("#assessPayrollMinLuxury()", function () {
            it("should store payroll and appropriately assess luxury and minimum payroll taxes for each team", function () {
                var tx = dao.tx(["players", "releasedPlayers", "teams"], "readwrite", tx);
                return finances.assessPayrollMinLuxury(tx).then(function () {
                    return dao.teams.getAll({ot: tx}).then(function (teams) {
                        var i;

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
                    });
                });
            });
        });
    });
});