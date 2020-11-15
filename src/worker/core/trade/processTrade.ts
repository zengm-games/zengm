import { PHASE } from "../../../common";
import { player } from "..";
import { idb } from "../../db";
import {
	g,
	helpers,
	logEvent,
	toUI,
	updatePlayMenu,
	recomputeLocalUITeamOvrs,
} from "../../util";
import type { TradeEventAssets, TradeSummary } from "../../../common/types";

const processTrade = async (
	tradeSummary: TradeSummary,
	tids: [number, number],
	pids: [number[], number[]],
	dpids: [number[], number[]],
) => {
	let pidsEvent = [...pids[0], ...pids[1]];
	const dpidsEvent = [...dpids[0], ...dpids[1]];

	const assets: TradeEventAssets = {};

	let maxPlayerValue = -Infinity;
	let maxPid: number | undefined;
	for (const j of [0, 1]) {
		const k = j === 0 ? 1 : 0;

		if (pids[j].length > 0) {
			const teamSeason = await idb.cache.teamSeasons.indexGet(
				"teamSeasonsBySeasonTid",
				[g.get("season"), tids[j]],
			);
			if (teamSeason) {
				teamSeason.numPlayersTradedAway += pids.length;
				await idb.cache.teamSeasons.put(teamSeason);
			}
		}

		assets[tids[k]] = [];

		for (const pid of pids[j]) {
			const p = await idb.cache.players.get(pid);
			if (!p) {
				throw new Error("Invalid pid");
			}
			p.tid = tids[k];

			// p.gamesUntilTradable = 14; // Don't make traded players untradable
			p.ptModifier = 1; // Reset

			if (g.get("phase") <= PHASE.PLAYOFFS) {
				await player.addStatsRow(p, g.get("phase") === PHASE.PLAYOFFS);
			}

			if (!p.transactions) {
				p.transactions = [];
			}
			p.transactions.push({
				season: g.get("season"),
				phase: g.get("phase"),
				tid: p.tid,
				type: "trade",
				fromTid: tids[j],
			});

			if (p.valueFuzz > maxPlayerValue) {
				maxPlayerValue = p.valueFuzz;
				maxPid = p.pid;
			}

			await idb.cache.players.put(p);

			assets[tids[k]].push({
				pid,
				tid: tids[j],
				name: `${p.firstName} ${p.lastName}`,
			});
		}

		for (const dpid of dpids[j]) {
			const dp = await idb.cache.draftPicks.get(dpid);
			if (!dp) {
				throw new Error("Invalid dpid");
			}
			dp.tid = tids[k];
			await idb.cache.draftPicks.put(dp);

			assets[tids[k]].push({
				...dp,
			});
		}
	}

	await toUI("realtimeUpdate", [["playerMovement"]]);
	await recomputeLocalUITeamOvrs();

	// If draft pick was changed...
	if (g.get("phase") === PHASE.DRAFT) {
		await updatePlayMenu();
	}

	// Make sure to show best player first, so his picture is shown in news feed
	if (maxPid !== undefined) {
		pidsEvent = [maxPid, ...pidsEvent.filter(pid => pid !== maxPid)];
	}

	logEvent({
		type: "trade",
		showNotification: false,
		pids: pidsEvent,
		dpids: dpidsEvent,
		tids: Array.from(tids), // Array.from is for Flow
		score: Math.round(helpers.bound(maxPlayerValue - 40, 0, Infinity)),
		assets,
		phase: g.get("phase"),
	});
};

export default processTrade;
