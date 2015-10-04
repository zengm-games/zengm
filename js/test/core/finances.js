/**
 * @name test.core.finances
 * @namespace Tests for core.finances.
 */
'use strict';

var assert = require('assert');
var dao = require('../../dao');
var db = require('../../db');
var g = require('../../globals');
var league = require('../../core/league');
var finances = require('../../core/finances');

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
                        assert(teams[i].seasons[0].payrollEndOfSeason > 0);

                        if (teams[i].seasons[0].payrollEndOfSeason > g.luxuryPayroll) {
                            assert.equal(teams[i].seasons[0].expenses.luxuryTax.amount, g.luxuryTax * (teams[i].seasons[0].payrollEndOfSeason - g.luxuryPayroll));
                        } else {
                            assert.equal(teams[i].seasons[0].expenses.luxuryTax.amount, 0);
                        }

                        if (teams[i].seasons[0].payrollEndOfSeason < g.minPayroll) {
                            assert.equal(teams[i].seasons[0].expenses.minTax.amount, g.minPayroll - teams[i].seasons[0].payrollEndOfSeason);
                        } else {
                            assert.equal(teams[i].seasons[0].expenses.minTax.amount, 0);
                        }
                    }
                });
            });
        });
    });
});
