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
import type { TradeEventTeams, TradeSummary } from "../../../common/types";

const processTrade = async (
	tradeSummary: TradeSummary,
	tids: [number, number],
	pids: [number[], number[]],
	dpids: [number[], number[]],
) => {
	let pidsEvent = [...pids[0], ...pids[1]];
	const dpidsEvent = [...dpids[0], ...dpids[1]];

	const teams: TradeEventTeams = [
		{
			assets: [],
		},
		{
			assets: [],
		},
	];

	let maxPlayerValue = -Infinity;
	let maxPid: number | undefined;
	for (const j of [0, 1]) {
		for (const pid of pids[j]) {
			const p = await idb.cache.players.get(pid);
			if (p && p.valueFuzz > maxPlayerValue) {
				maxPlayerValue = p.valueFuzz;
				maxPid = p.pid;
			}
		}
	}

	// Make sure to show best player first, so his picture is shown in news feed
	if (maxPid !== undefined) {
		pidsEvent = [maxPid, ...pidsEvent.filter(pid => pid !== maxPid)];
	}

	const eid = await logEvent({
		type: "trade",
		showNotification: false,
		pids: pidsEvent,
		dpids: dpidsEvent,
		tids: Array.from(tids), // Array.from is for Flow
		score: Math.round(helpers.bound(maxPlayerValue - 40, 0, Infinity)),
		teams,
		phase: g.get("phase"),
	});

	for (const j of [0, 1]) {
		const k = j === 0 ? 1 : 0;

		let teamSeason;
		if (pids[j].length > 0) {
			teamSeason = await idb.cache.teamSeasons.indexGet(
				"teamSeasonsBySeasonTid",
				[g.get("season"), tids[j]],
			);
		}

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
				eid,
			});

			await idb.cache.players.put(p);

			teams[k].assets.push({
				pid,
				name: `${p.firstName} ${p.lastName}`,
				contract: p.contract,
				ratingsIndex: p.ratings.length - 1,
				statsIndex: p.stats.length - 1,
			});

			if (teamSeason) {
				// Bad players do not actually count as a "player traded away"
				teamSeason.numPlayersTradedAway += helpers.sigmoid(
					p.valueNoPot / 100,
					30,
					0.47,
				);
			}
		}

		if (teamSeason) {
			await idb.cache.teamSeasons.put(teamSeason);
		}

		for (const dpid of dpids[j]) {
			const dp = await idb.cache.draftPicks.get(dpid);
			if (!dp) {
				throw new Error("Invalid dpid");
			}
			dp.tid = tids[k];
			await idb.cache.draftPicks.put(dp);

			teams[k].assets.push({
				dpid: dp.dpid,
				season: dp.season,
				round: dp.round,
				originalTid: dp.originalTid,
			});
		}
	}

	await toUI("realtimeUpdate", [["playerMovement"]]);
	await recomputeLocalUITeamOvrs();

	// If draft pick was changed...
	if (g.get("phase") === PHASE.DRAFT) {
		await updatePlayMenu();
	}
};

export default processTrade;
