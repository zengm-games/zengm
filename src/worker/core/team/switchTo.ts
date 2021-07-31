import { idb } from "../../db";
import { league } from "..";
import { g, toUI } from "../../util";
import deleteUnreadMessages from "./deleteUnreadMessages";

const switchTo = async (tid: number, tids?: number[]) => {
	await league.setGameAttributes({
		gameOver: false,
		userTid: tid,
		userTids: tids ? tids : [tid],
		gracePeriodEnd: g.get("season") + 3, // +3 is the same as +2 when staring a new league, since this happens at the end of a season
		otherTeamsWantToHire: false,
	});

	league.updateMeta();

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

	await deleteUnreadMessages();

	await toUI("realtimeUpdate", [["leagues"]]);
};

export default switchTo;
