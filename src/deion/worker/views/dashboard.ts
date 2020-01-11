import { idb } from "../db";
import { UpdateEvents } from "../../common/types";

const updateDashboard = async (inputs: {}, updateEvents: UpdateEvents) => {
	if (updateEvents.includes("firstRun") || updateEvents.includes("leagues")) {
		const leagues = await idb.meta.leagues.getAll();

		for (const league of leagues) {
			if (league.teamRegion === undefined) {
				league.teamRegion = "???";
			}

			if (league.teamName === undefined) {
				league.teamName = "???";
			}
		}

		return {
			leagues,
		};
	}
};

export default {
	runBefore: [updateDashboard],
};
