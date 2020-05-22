import { idb } from "../../db";
import { league } from "..";
import { g, toUI } from "../../util";

const switchTo = async (tid: number, tids?: number[]) => {
	await league.setGameAttributes({
		gameOver: false,
		userTid: tid,
		userTids: tids ? tids : [tid],
		gracePeriodEnd: g.get("season") + 3, // +3 is the same as +2 when staring a new league, since this happens at the end of a season
	});
	league.updateMetaNameRegion(
		g.get("teamNamesCache")[g.get("userTid")],
		g.get("teamRegionsCache")[g.get("userTid")],
	);
	const teamSeason = await idb.cache.teamSeasons.indexGet(
		"teamSeasonsByTidSeason",
		[tid, g.get("season")],
	);
	if (teamSeason) {
		teamSeason.ownerMood = {
			money: 0,
			playoffs: 0,
			wins: 0,
		};
		await idb.cache.teamSeasons.put(teamSeason);
	}
	await toUI("realtimeUpdate", [["leagues"]]);
};

export default switchTo;
