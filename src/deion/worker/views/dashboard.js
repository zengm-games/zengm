// @flow

import { idb } from "../db";
import type { UpdateEvents } from "../../common/types";

const updateDashboard = async (
	inputs,
	updateEvents: UpdateEvents,
): void | { [key: string]: any } => {
	console.log("updateEvents", updateEvents);
	if (updateEvents.includes("firstRun") || updateEvents.includes("leagues")) {
		const leagues = await idb.meta.leagues.getAll();
		console.log("leagues", leagues);

		for (const league of leagues) {
			if (league.teamRegion === undefined) {
				league.teamRegion = "???";
			}
			if (league.teamName === undefined) {
				league.teamName = "???";
			}
			delete league.tid;
		}

		return {
			leagues,
		};
	}
};

export default {
	runBefore: [updateDashboard],
};
