import { idb } from "../../db";
import { player, league, draft } from "..";
import { g, updateStatus, updatePlayMenu, random } from "../../util";
import { PHASE } from "../../../common";

const disable = async (tid: number) => {
	const t = await idb.cache.teams.get(tid);
	if (!t) {
		throw new Error(`Invalid tid ${tid}`);
	}

	t.disabled = true;
	await idb.cache.teams.put(t);

	if (tid === g.get("userTid")) {
		// If there is an unread message from the owner, it's not doing any good now
		const messages = await idb.getCopies.messages({ limit: 1 });
		if (messages.length > 0 && !messages[0].read) {
			await idb.cache.messages.delete(messages[0].mid);
		}

		if (g.get("userTids").length > 1) {
			// If it's multi team mode, just move to the next team
			const newUserTids = g.get("userTids").filter(userTid => userTid !== tid);
			const newUserTid = random.choice(newUserTids);
			await league.setGameAttributes({
				userTid: newUserTid,
				userTids: newUserTids,
			});
		} else {
			// If it's not multi team mode, then this is similar to being fired
			await league.setGameAttributes({
				gameOver: true,
			});
			await updateStatus();
			await updatePlayMenu();
		}
	}

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
