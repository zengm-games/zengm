import { idb } from "../db";
import { g } from "../util";
import { UpdateEvents } from "../../common/types";

async function updateLeagueFinances(
	inputs: {
		season: number;
	},
	updateEvents: UpdateEvents,
	state: any,
) {
	if (
		updateEvents.includes("firstRun") ||
		inputs.season !== state.season ||
		inputs.season === g.season
	) {
		const teams = await idb.getCopies.teamsPlus({
			attrs: ["tid", "abbrev", "region", "name"],
			seasonAttrs: [
				"att",
				"revenue",
				"profit",
				"cash",
				"payroll",
				"salaryPaid",
				"pop",
			],
			season: inputs.season,
		});
		return {
			budget: g.budget,
			currentSeason: g.season,
			hardCap: g.hardCap,
			season: inputs.season,
			salaryCap: g.salaryCap / 1000,
			minPayroll: g.minPayroll / 1000,
			luxuryPayroll: g.luxuryPayroll / 1000,
			luxuryTax: g.luxuryTax,
			teams,
			userTid: g.userTid,
		};
	}
}

export default updateLeagueFinances;
