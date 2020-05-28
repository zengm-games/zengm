import { idb } from "../../db";
import { player, league, draft } from "..";
import { g } from "../../util";
import { PHASE } from "../../../common";

const disable = async (tid: number) => {
	const t = await idb.cache.teams.get(tid);
	if (!t) {
		throw new Error(`Invalid tid ${tid}`);
	}

	t.disabled = true;
	await idb.cache.teams.put(t);

	// Delete draft picks, and return traded ones to original owner
	const draftPicks = await idb.cache.draftPicks.getAll();
	for (const dp of draftPicks) {
		if (dp.originalTid === t.tid) {
			await idb.cache.draftPicks.delete(dp.dpid);
		} else if (dp.tid === t.tid) {
			dp.tid = dp.originalTid;
			await idb.cache.draftPicks.put(dp);
		}
	}

	// Make all players free agents
	const players = await idb.cache.players.indexGetAll("playersByTid", t.tid);
	const baseMoods = await player.genBaseMoods();

	for (const p of players) {
		player.addToFreeAgents(p, g.get("phase"), baseMoods);
		await idb.cache.players.put(p);
	}

	// In preseason, need to delete teamSeason and teamStats
	if (g.get("phase") < PHASE.PLAYOFFS) {
		const teamSeason = await idb.cache.teamSeasons.indexGet(
			"teamSeasonsByTidSeason",
			[t.tid, g.get("season")],
		);
		if (teamSeason) {
			idb.cache.teamSeasons.delete(teamSeason.rid);
		}

		const teamStats = await idb.cache.teamSeasons.indexGet(
			"teamStatsByPlayoffsTid",
			[false, t.tid],
		);
		if (teamStats) {
			await idb.cache.teamSeasons.delete(teamStats.rid);
		}
	}

	await draft.deleteLotteryResultIfNoDraftYet();

	await league.setGameAttributes({
		teamInfoCache: g.get("teamInfoCache").map((t2, tid) => {
			if (t.tid !== tid) {
				return t2;
			}

			return {
				...t2,
				disabled: true,
			};
		}),
	});
};

export default disable;
