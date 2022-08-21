import { getRealTeamInfo } from "./newLeague";

const updateExhibition = async () => {
	return {
		realTeamInfo: await getRealTeamInfo(),
	};
};

export default updateExhibition;
