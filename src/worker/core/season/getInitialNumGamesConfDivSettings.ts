import type { NewScheduleGoodSettings } from "./newScheduleGood";
import newScheduleGood from "./newScheduleGood";

const getInitialNumGamesConfDivSettings = (
	teams: {
		tid: number;
		cid: number;
		did: number;
	}[],
	settingsInput: NewScheduleGoodSettings,
) => {
	const settings = {
		...settingsInput,
	};

	const scheduleTeams = teams.map(t => ({
		tid: t.tid,
		seasonAttrs: {
			did: t.did,
			cid: t.cid,
		},
	}));

	while (settings.numGamesDiv !== null && settings.numGamesConf !== null) {
		const { warning } = newScheduleGood(scheduleTeams, settings);
		if (warning === undefined) {
			break;
		}

		for (const key of ["numGamesDiv", "numGamesConf"] as const) {
			if (settings[key] !== null) {
				(settings[key] as number) -= 2;
				if ((settings[key] as number) <= 0) {
					settings[key] = null;
				}
			}
		}
	}

	return {
		numGamesDiv: settings.numGamesDiv,
		numGamesConf: settings.numGamesConf,
	};
};

export default getInitialNumGamesConfDivSettings;
