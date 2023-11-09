import { DEFAULT_TEAM_COLORS } from "../../common";
import { idb } from "../db";

const getTeamColors = async (tid: number) => {
	let teamColors: [string, string, string] = DEFAULT_TEAM_COLORS;

	if (tid >= 0) {
		const t = await idb.cache.teams.get(tid);

		if (t) {
			teamColors = t.colors;
		}
	}

	return teamColors;
};

export default getTeamColors;
