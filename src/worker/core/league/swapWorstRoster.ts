import { idb } from "../../db/index.ts";
import { g, logEvent } from "../../util/index.ts";
import { getTeamOvr } from "../../views/newTeam.ts";
import { orderBy } from "../../../common/utils.ts";
import player from "../player/index.ts";

// Swap the user's roster with the roster of the worst team in the league, by ovr
const swapWorstRoster = async (addSisyphusLogs: boolean) => {
	const teams = g
		.get("teamInfoCache")
		.map((t, tid) => {
			return {
				tid,
				disabled: t.disabled,
				ovr: -Infinity,
			};
		})
		.filter((t) => !t.disabled);

	for (const t of teams) {
		t.ovr = await getTeamOvr(t.tid);
	}

	const teamsSorted = orderBy(teams, "ovr", "asc");

	const userTid = g.get("userTid");
	const worstTid = teamsSorted[0]!.tid;

	if (userTid === worstTid) {
		return {
			swappedTid: undefined,
		};
	}

	const userTeam = await idb.cache.players.indexGetAll("playersByTid", userTid);
	const worstTeam = await idb.cache.players.indexGetAll(
		"playersByTid",
		worstTid,
	);

	for (const { newTid, oldTid, players } of [
		{
			newTid: userTid,
			oldTid: worstTid,
			players: worstTeam,
		},
		{
			newTid: worstTid,
			oldTid: userTid,
			players: userTeam,
		},
	]) {
		for (const p of players) {
			p.tid = newTid;

			if (addSisyphusLogs) {
				await logEvent({
					type: "sisyphus",
					showNotification: false,
					pids: [p.pid],
					tids: [newTid, oldTid],
					wonTitle: userTid === oldTid,
				});

				if (!p.transactions) {
					p.transactions = [];
				}
				p.transactions.push({
					season: g.get("season"),
					phase: g.get("phase"),
					tid: newTid,
					type: "sisyphus",
					fromTid: oldTid,
				});
			}

			await idb.cache.players.put(p);
		}
	}

	// Check for retired jersey numbers (would be more efficient to get retiredJerseyNumbers once per team and check before calling genJerseyNumber, but oh well)
	for (const p of [...userTeam, ...worstTeam]) {
		if (p.jerseyNumber !== undefined) {
			await player.setJerseyNumber(p, await player.genJerseyNumber(p));
		}
	}

	return {
		swappedTid: worstTid,
	};
};

export default swapWorstRoster;
