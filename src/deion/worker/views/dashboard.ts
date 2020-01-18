import { idb } from "../db";
import { UpdateEvents, League } from "../../common/types";

const updateDashboard = async (inputs: unknown, updateEvents: UpdateEvents) => {
	if (updateEvents.includes("firstRun") || updateEvents.includes("leagues")) {
		const leagues: League[] = await idb.meta.leagues.getAll();

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
