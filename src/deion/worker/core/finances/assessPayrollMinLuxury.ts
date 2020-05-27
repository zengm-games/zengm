import { team } from "..";
import { idb } from "../../db";
import { g } from "../../util";

/**
 * Assess the payroll and apply minimum and luxury taxes.
 * Distribute half of the collected luxury taxes to teams under the salary cap.
 *
 * @memberOf core.finances
 * @return {Promise}
 */
const assessPayrollMinLuxury = async () => {
	let collectedTax = 0;
	const payrolls = await team.getPayrolls();
	const teamSeasons = await idb.cache.teamSeasons.indexGetAll(
		"teamSeasonsBySeasonTid",
		[[g.get("season")], [g.get("season"), "Z"]],
	);

	for (const teamSeason of teamSeasons) {
		// Store payroll
		teamSeason.payrollEndOfSeason = payrolls[teamSeason.tid]; // Assess minimum payroll tax and luxury tax

		if (payrolls[teamSeason.tid] < g.get("minPayroll")) {
			teamSeason.expenses.minTax.amount =
				g.get("minPayroll") - payrolls[teamSeason.tid];
			teamSeason.cash -= teamSeason.expenses.minTax.amount;
		} else if (
			payrolls[teamSeason.tid] > g.get("luxuryPayroll") &&
			!g.get("hardCap")
		) {
			// Only apply luxury tax if hard cap is disabled!
			const amount =
				g.get("luxuryTax") *
				(payrolls[teamSeason.tid] - g.get("luxuryPayroll"));
			collectedTax += amount;
			teamSeason.expenses.luxuryTax.amount = amount;
			teamSeason.cash -= teamSeason.expenses.luxuryTax.amount;
		}
	}

	const defaultRank = (g.get("numActiveTeams") + 1) / 2;
	const payteams = payrolls.filter(x => x <= g.get("salaryCap"));

	if (payteams.length > 0 && collectedTax > 0) {
		const distribute = (collectedTax * 0.5) / payteams.length;

		for (const teamSeason of teamSeasons) {
			if (payrolls[teamSeason.tid] <= g.get("salaryCap")) {
				teamSeason.revenues.luxuryTaxShare = {
					amount: distribute,
					rank: defaultRank,
				};
				teamSeason.cash += distribute;
			} else {
				teamSeason.revenues.luxuryTaxShare = {
					amount: 0,
					rank: defaultRank,
				};
			}
		}
	}

	for (const teamSeason of teamSeasons) {
		await idb.cache.teamSeasons.put(teamSeason);
	}
};

export default assessPayrollMinLuxury;
