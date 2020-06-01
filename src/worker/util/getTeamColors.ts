import { idb } from "../db";

const getTeamColors = async (tid: number) => {
	let teamColors: [string, string, string] = ["#000000", "#cccccc", "#ffffff"];

	if (tid >= 0) {
		const t = await idb.cache.teams.get(tid);

		if (t) {
			teamColors = t.colors;
		}
	}

	return teamColors;
};

export default getTeamColors;
