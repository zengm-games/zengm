import { idb } from "../db/index.ts";
import { defineView } from "../util/defineView.ts";

export default defineView({
	id: "multiTeamMode",
	load: async ({ updateEvents }) => {
		if (
			updateEvents.has("firstRun") ||
			updateEvents.has("gameAttributes") ||
			updateEvents.has("newPhase")
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
	},
});
