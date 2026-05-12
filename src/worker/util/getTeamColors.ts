import { DEFAULT_TEAM_COLORS } from "../../common/constants.ts";
import { idb } from "../db/index.ts";

export const getTeamColors = async (tid: number) => {
	if (tid >= 0) {
		const t = await idb.cache.teams.get(tid);
		if (t) {
			return t.colors;
		}
	}

	return DEFAULT_TEAM_COLORS;
};
