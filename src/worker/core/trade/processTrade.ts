import { PHASE } from "../../../common/index.ts";
import { player } from "../index.ts";
import { idb } from "../../db/index.ts";
import {
	g,
	helpers,
	logEvent,
	toUI,
	updatePlayMenu,
	recomputeLocalUITeamOvrs,
} from "../../util/index.ts";
import type { TradeEventTeams } from "../../../common/types.ts";
import { getTeammateJerseyNumbers } from "../player/genJerseyNumber.ts";

const processTrade = async (
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
	for (const j of [0, 1] as const) {
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
		pidsEvent = [maxPid, ...pidsEvent.filter((pid) => pid !== maxPid)];
	}

	const eid = await logEvent({
		type: "trade",
		showNotification: false,
		pids: pidsEvent,
		dpids: dpidsEvent,
		tids,
		score: Math.round(helpers.bound(maxPlayerValue - 40, 0, Infinity)),
		teams,
		phase: g.get("phase"),
	});

	for (const j of [0, 1] as const) {
		const k = j === 0 ? 1 : 0;

		let teamSeason;
		if (pids[j].length > 0) {
			teamSeason = await idb.cache.teamSeasons.indexGet(
				"teamSeasonsBySeasonTid",
				[g.get("season"), tids[j]],
			);
		}

		const players = await idb.getCopies.players(
			{ pids: pids[j] },
			"noCopyCache",
		);
		if (players.length !== pids[j].length) {
			throw new Error("Invalid pid");
		}

		for (const p of players) {
			p.tid = tids[k];

			// p.gamesUntilTradable = 14; // Don't make traded players untradable
			p.ptModifier = 1; // Reset

			if (g.get("phase") <= PHASE.PLAYOFFS) {
				// If two players being traded for each other have the same jersey number, that shouldn't be treated as conflict and they should be able to keep their jersey numbers - that's what the pids[k] part does.
				// Recompute this for every player, otherwise two incoming players could pick the same jersey number.
				const teamJerseyNumbers = await getTeammateJerseyNumbers(p.tid, [
					p.pid,
					...pids[k],
				]);

				// Also add other traded players coming along with this one, if they haven't been processed yet, so their current number doesn't get stolen before they get processed
				for (const p2 of players) {
					if (p2.pid !== p.pid && p2.tid !== tids[k]) {
						const currentNumber = helpers.getJerseyNumber(p2);
						if (currentNumber !== undefined) {
							teamJerseyNumbers.push(currentNumber);
						}
					}
				}

				player.setJerseyNumber(
					p,
					await player.genJerseyNumber(p, teamJerseyNumbers),
				);
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
				pid: p.pid,
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
