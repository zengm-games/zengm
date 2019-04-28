// @flow

import assert from "assert";
import testHelpers from "../../../test/helpers";
import { finances, player, team } from "..";
import { idb } from "../../db";
import { g } from "../../util";

describe("worker/core/finances/assessPayrollMinLuxury", () => {
    it("store payroll and appropriately assess luxury and minimum payroll taxes for each team", async () => {
        testHelpers.resetG();

        // Three teams. One above the luxury payroll, one below the minimum payroll, and one in between.
        g.numTeams = 3;

        // One player per team is all that's needed for payroll calculation.
        const players = [
            player.generate(0, 30, 2017, true, 15.5),
            player.generate(1, 30, 2017, true, 15.5),
            player.generate(2, 30, 2017, true, 15.5),
        ];

        players[0].contract.amount = g.luxuryPayroll + 1;
        players[1].contract.amount = (g.luxuryPayroll + g.minPayroll) / 2;
        players[2].contract.amount = g.minPayroll - 1;

        await testHelpers.resetCache({
            players,
            teamSeasons: [
                team.genSeasonRow(0),
                team.genSeasonRow(1),
                team.genSeasonRow(2),
            ],
        });

        await finances.assessPayrollMinLuxury();
        const teamSeasons = await idb.cache.teamSeasons.getAll();
        assert.equal(teamSeasons.length, g.numTeams);

        for (let i = 0; i < g.numTeams; i++) {
            assert(teamSeasons[i].payrollEndOfSeason > 0);

            if (teamSeasons[i].payrollEndOfSeason > g.luxuryPayroll) {
                assert.equal(
                    teamSeasons[i].expenses.luxuryTax.amount,
                    g.luxuryTax *
                        (teamSeasons[i].payrollEndOfSeason - g.luxuryPayroll),
                );
                assert.equal(
                    teamSeasons[i].expenses.luxuryTax.amount,
                    g.luxuryTax * 1,
                );
            } else {
                assert.equal(teamSeasons[i].expenses.luxuryTax.amount, 0);
            }

            if (teamSeasons[i].payrollEndOfSeason < g.minPayroll) {
                assert.equal(
                    teamSeasons[i].expenses.minTax.amount,
                    g.minPayroll - teamSeasons[i].payrollEndOfSeason,
                );
                assert.equal(teamSeasons[i].expenses.minTax.amount, 1);
            } else {
                assert.equal(teamSeasons[i].expenses.minTax.amount, 0);
            }
        }
    });
});
