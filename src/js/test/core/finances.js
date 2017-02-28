import assert from 'assert';
import {Cache, connectMeta, idb} from '../../db';
import {g} from '../../common';
import * as league from '../../core/league';
import * as finances from '../../core/finances';

describe("core/finances", () => {
    before(async () => {
        idb.meta = await connectMeta();
        await league.create("Test", 0, undefined, 2013, false);
        idb.cache = new Cache();
        await idb.cache.fill();
    });
    after(() => league.remove(g.lid));

    describe("#assessPayrollMinLuxury()", () => {
        it("should store payroll and appropriately assess luxury and minimum payroll taxes for each team", async () => {
            await finances.assessPayrollMinLuxury();
            const teamSeasons = await idb.cache.getAll('teamSeasons');
            assert.equal(teamSeasons.length, g.numTeams);

            for (let i = 0; i < g.numTeams; i++) {
                assert(teamSeasons[i].payrollEndOfSeason > 0);

                if (teamSeasons[i].payrollEndOfSeason > g.luxuryPayroll) {
                    assert.equal(teamSeasons[i].expenses.luxuryTax.amount, g.luxuryTax * (teamSeasons[i].payrollEndOfSeason - g.luxuryPayroll));
                } else {
                    assert.equal(teamSeasons[i].expenses.luxuryTax.amount, 0);
                }

                if (teamSeasons[i].payrollEndOfSeason < g.minPayroll) {
                    assert.equal(teamSeasons[i].expenses.minTax.amount, g.minPayroll - teamSeasons[i].payrollEndOfSeason);
                } else {
                    assert.equal(teamSeasons[i].expenses.minTax.amount, 0);
                }
            }
        });
    });
});
