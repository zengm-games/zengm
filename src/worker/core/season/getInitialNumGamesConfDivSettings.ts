import type { NewScheduleGoodSettings } from "./newScheduleGood.ts";
import newScheduleGood from "./newScheduleGood.ts";

export const TOO_MANY_TEAMS_TOO_SLOW = 150;

const getInitialNumGamesConfDivSettings = (
	teams: {
		disabled?: boolean;
		tid: number;
		cid: number;
		did: number;
	}[],
	settingsInput: NewScheduleGoodSettings,
) => {
	const settings = {
		...settingsInput,
	};

	const scheduleTeams = teams
		.filter((t) => !t.disabled)
		.map((t) => ({
			tid: t.tid,
			seasonAttrs: {
				did: t.did,
				cid: t.cid,
			},
		}));

	if (
		settings.numGamesDiv !== null &&
		settings.numGamesConf !== null &&
		scheduleTeams.length < TOO_MANY_TEAMS_TOO_SLOW
	) {
		const { warning } = newScheduleGood(scheduleTeams, settings);
		if (warning !== undefined) {
			return {
				altered: true,
				numGamesDiv: null,
				numGamesConf: null,
			};
		}
	}

	return {
		numGamesDiv: settings.numGamesDiv,
		numGamesConf: settings.numGamesConf,
	};
};

export default getInitialNumGamesConfDivSettings;
