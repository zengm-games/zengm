import orderBy from "lodash-es/orderBy";
import { idb } from "../../db";
import { g, logEvent } from "../../util";
import { getTeamOvr } from "../../views/newTeam";
import player from "../player";
import { PHASE } from "../../../common";

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
		.filter(t => !t.disabled);

	for (const t of teams) {
		t.ovr = await getTeamOvr(t.tid);
	}

	const teamsSorted = orderBy(teams, "ovr", "asc");

	const userTid = g.get("userTid");
	const worstTid = teamsSorted[0].tid;

	if (userTid === worstTid) {
		return {
			swappedTid: undefined,
		};
	}

	const season = g.get("season");
	const phase = g.get("phase");

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

			// Remove obsolete stats row if necessary
			const lastStats = p.stats.at(-1);
			if (
				lastStats &&
				lastStats.tid === oldTid &&
				lastStats.gp === 0 &&
				lastStats.season === season &&
				phase <= PHASE.PLAYOFFS
			) {
				p.stats.pop();
				p.statsTids = Array.from(new Set(p.stats.map(row => row.tid)));
				player.addStatsRow(p, phase === PHASE.PLAYOFFS);
			}

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

	return {
		swappedTid: worstTid,
	};
};

export default swapWorstRoster;
