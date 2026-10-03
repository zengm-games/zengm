import { idb } from "../db/index.ts";
import { defineView } from "../util/defineView.ts";

export default defineView({
	id: "dashboard",
	load: async ({ updateEvents }) => {
		if (updateEvents.includes("firstRun") || updateEvents.includes("leagues")) {
			const leagues = await idb.meta.getAll("leagues");

			for (const league of leagues) {
				league.teamRegion ??= "???";
				league.teamName ??= "???";
			}

			return {
				leagues,
			};
		}
	},
});
