import { idb } from "../../db/index.ts";
import { league } from "../index.ts";
import { g, toUI } from "../../util/index.ts";
import deleteUnreadMessages from "./deleteUnreadMessages.ts";

const switchTo = async (tid: number, tids?: number[]) => {
	const prevTid = g.get("userTid");

	await league.setGameAttributes({
		gameOver: false,
		userTid: tid,
		userTids: tids ? tids : [tid],
		gracePeriodEnd: g.get("season") + 3, // +3 is the same as +2 when staring a new league, since this happens at the end of a season
		otherTeamsWantToHire: false,
	});

	league.updateMeta();

	// Reset prev and next team mood. Prev handles exporting and then importing with a new team. And next makes sure the new team is always 0 mood.
	for (const tid2 of [prevTid, tid]) {
		const teamSeason = await idb.cache.teamSeasons.indexGet(
			"teamSeasonsByTidSeason",
			[tid2, g.get("season")],
		);
		if (teamSeason) {
			teamSeason.ownerMood = {
				money: 0,
				playoffs: 0,
				wins: 0,
			};
			await idb.cache.teamSeasons.put(teamSeason);
		}
	}

	await deleteUnreadMessages();

	await toUI("realtimeUpdate", [["leagues"]]);
};

export default switchTo;
