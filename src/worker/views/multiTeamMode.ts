import { idb } from "../db/index.ts";
import { defineView } from "../util/defineView.ts";

export default defineView("multiTeamMode", async ({ updateEvents }) => {
	if (
		updateEvents.includes("firstRun") ||
		updateEvents.includes("gameAttributes") ||
		updateEvents.includes("newPhase")
	) {
		const teamsAll = await idb.cache.teams.getAll();

		const teams = teamsAll
			.filter((t) => !t.disabled)
			.map((t) => ({
				tid: t.tid,
				region: t.region,
				name: t.name,
			}));

		return {
			teams,
		};
	}
});
