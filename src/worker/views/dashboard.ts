import { idb } from "../db";
import type { UpdateEvents } from "../../common/types";

const updateDashboard = async (inputs: unknown, updateEvents: UpdateEvents) => {
	if (updateEvents.includes("firstRun") || updateEvents.includes("leagues")) {
		const leagues = await idb.meta.getAll("leagues");

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

export default updateDashboard;
