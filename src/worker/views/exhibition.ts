import { getDefaultSettings, getRealTeamInfo } from "./newLeague.ts";
import { defineView } from "../util/defineView.ts";

export default defineView("exhibition", async () => {
	const defaultSettings = {
		...getDefaultSettings(),
		numActiveTeams: undefined,
	};

	return {
		defaultSettings,
		realTeamInfo: await getRealTeamInfo(),
	};
});
