// @flow

import { idb } from "../db";

async function updateDashboard(): void | { [key: string]: any } {
	const leagues = await idb.meta.leagues.getAll();

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

export default {
	runBefore: [updateDashboard],
};
