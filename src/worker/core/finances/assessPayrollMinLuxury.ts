import { team } from "..";
import { idb } from "../../db";
import { g, helpers, logEvent } from "../../util";

const rosterLink = (tid: number) =>
	`<a href="${helpers.leagueUrl([
		"roster",
		g.get("teamInfoCache")[tid]?.abbrev,
		g.get("season"),
	])}">${g.get("teamInfoCache")[tid]?.name}</a>`;

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
		const tid = teamSeason.tid;
		const payroll = payrolls[tid];
		if (payroll === undefined) {
			throw new Error(`No payroll found for team ${tid}`);
		}

		// Store payroll
		teamSeason.payrollEndOfSeason = payroll;

		// Assess minimum payroll tax and luxury tax
		if (payroll < g.get("minPayroll")) {
			teamSeason.expenses.minTax.amount = g.get("minPayroll") - payroll;
			teamSeason.cash -= teamSeason.expenses.minTax.amount;

			logEvent({
				type: "minPayroll",
				text: `The ${rosterLink(
					tid,
				)} paid a minimum payroll penalty of ${helpers.formatCurrency(
					teamSeason.expenses.minTax.amount / 1000,
					"M",
				)} for having a payroll under ${helpers.formatCurrency(
					g.get("minPayroll") / 1000,
					"M",
				)}.`,
				tids: [tid],
				showNotification: tid === g.get("userTid"),
				score: 10,
			});
		} else if (payroll > g.get("luxuryPayroll") && !g.get("hardCap")) {
			// Only apply luxury tax if hard cap is disabled!
			const amount = g.get("luxuryTax") * (payroll - g.get("luxuryPayroll"));
			collectedTax += amount;
			teamSeason.expenses.luxuryTax.amount = amount;
			teamSeason.cash -= teamSeason.expenses.luxuryTax.amount;

			logEvent({
				type: "luxuryTax",
				text: `The ${rosterLink(
					tid,
				)} paid a luxury tax of ${helpers.formatCurrency(
					amount / 1000,
					"M",
				)} for having a payroll above ${helpers.formatCurrency(
					g.get("luxuryPayroll") / 1000,
					"M",
				)}.`,
				tids: [tid],
				showNotification: tid === g.get("userTid"),
				score: 10,
			});
		}
	}

	const defaultRank = (g.get("numActiveTeams") + 1) / 2;
	const payteams = Object.values(payrolls).filter(
		x => x !== undefined && x <= g.get("salaryCap"),
	);

	if (payteams.length > 0 && collectedTax > 0) {
		const distribute = (collectedTax * 0.5) / payteams.length;

		for (const teamSeason of teamSeasons) {
			const tid = teamSeason.tid;
			const payroll = payrolls[tid];
			if (payroll === undefined) {
				throw new Error(`No payroll found for team ${tid}`);
			}

			if (payroll <= g.get("salaryCap")) {
				teamSeason.revenues.luxuryTaxShare = {
					amount: distribute,
					rank: defaultRank,
				};
				teamSeason.cash += distribute;

				logEvent({
					type: "luxuryTaxDist",
					text: `The ${rosterLink(
						tid,
					)} recieved a luxury tax distribution of ${helpers.formatCurrency(
						distribute / 1000,
						"M",
					)} for having a payroll under ${helpers.formatCurrency(
						g.get("salaryCap") / 1000,
						"M",
					)}.`,
					tids: [tid],
					showNotification: tid === g.get("userTid"),
					score: 10,
				});
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
