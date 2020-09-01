import assert from "assert";
import testHelpers from "../../../test/helpers";
import { finances, player, team } from "..";
import { idb } from "../../db";
import { g, helpers } from "../../util";

describe("worker/core/finances/assessPayrollMinLuxury", () => {
	test("store payroll and appropriately assess luxury and minimum payroll taxes for each team", async () => {
		testHelpers.resetG();

		// Three teams. One above the luxury payroll, one below the minimum payroll, and one in between.
		g.setWithoutSavingToDB("numTeams", 3);
		g.setWithoutSavingToDB("numActiveTeams", 3);

		// One player per team is all that's needed for payroll calculation.
		const players = [
			player.generate(0, 30, 2017, true, 15.5),
			player.generate(1, 30, 2017, true, 15.5),
			player.generate(2, 30, 2017, true, 15.5),
		];
		players[0].contract.amount = g.get("luxuryPayroll") + 1;
		players[1].contract.amount =
			(g.get("luxuryPayroll") + g.get("minPayroll")) / 2;
		players[2].contract.amount = g.get("minPayroll") - 1;

		const teamsDefault = helpers.getTeamsDefault().slice(0, 3);
		const teams = teamsDefault.map(team.generate);

		await testHelpers.resetCache({
			players,
			teamSeasons: [
				team.genSeasonRow(teamsDefault[0]),
				team.genSeasonRow(teamsDefault[1]),
				team.genSeasonRow(teamsDefault[2]),
			],
			teams,
		});

		await finances.assessPayrollMinLuxury();
		const teamSeasons = await idb.cache.teamSeasons.getAll();
		assert.strictEqual(teamSeasons.length, g.get("numActiveTeams"));

		for (let i = 0; i < g.get("numActiveTeams"); i++) {
			assert(teamSeasons[i].payrollEndOfSeason > 0);

			if (teamSeasons[i].payrollEndOfSeason > g.get("luxuryPayroll")) {
				assert.strictEqual(
					teamSeasons[i].expenses.luxuryTax.amount,
					g.get("luxuryTax") *
						(teamSeasons[i].payrollEndOfSeason - g.get("luxuryPayroll")),
				);
				assert.strictEqual(
					teamSeasons[i].expenses.luxuryTax.amount,
					g.get("luxuryTax") * 1,
				);
			} else {
				assert.strictEqual(teamSeasons[i].expenses.luxuryTax.amount, 0);
			}

			if (teamSeasons[i].payrollEndOfSeason < g.get("minPayroll")) {
				assert.strictEqual(
					teamSeasons[i].expenses.minTax.amount,
					g.get("minPayroll") - teamSeasons[i].payrollEndOfSeason,
				);
				assert.strictEqual(teamSeasons[i].expenses.minTax.amount, 1);
			} else {
				assert.strictEqual(teamSeasons[i].expenses.minTax.amount, 0);
			}
		}
	});
});
