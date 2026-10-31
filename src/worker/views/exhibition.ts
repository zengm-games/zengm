import { getDefaultSettings, getRealTeamInfo } from "./newLeague.ts";
import { defineView } from "../util/defineView.ts";

export default defineView({
	id: "exhibition",
	load: async () => {
		const defaultSettings = {
			...getDefaultSettings(),
			numActiveTeams: undefined,
		};

		return {
			defaultSettings,
			realTeamInfo: await getRealTeamInfo(),
		};
	},
});
