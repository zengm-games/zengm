import { DEFAULT_TEAM_COLORS } from "../../common/index.ts";
import { idb } from "../db/index.ts";

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
