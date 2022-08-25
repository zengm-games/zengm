import { getDefaultSettings, getRealTeamInfo } from "./newLeague";

const updateExhibition = async () => {
	const defaultSettings = {
		...getDefaultSettings(),
		numActiveTeams: undefined,
	};

	return {
		defaultSettings,
		realTeamInfo: await getRealTeamInfo(),
	};
};

export default updateExhibition;
