import { PHASE } from "../../../common/constants.ts";
import { player } from "../index.ts";
import { idb } from "../../db/index.ts";
import {
	g,
	helpers,
	logEvent,
	toUI,
	updatePlayMenu,
} from "../../util/index.ts";
import {
	type DraftPick,
	type Player,
	type Team,
	type TeamSeason,
	type TradeEventTeams,
	type TradeTeams,
} from "../../../common/types.ts";
import { getTeammateJerseyNumbers } from "../player/genJerseyNumber.ts";
import { recomputeLocalUITeamOvrs } from "../../util/recomputeLocalUITeamOvrs.ts";

const processTrade = async (
	rawTeams: TradeTeams,
	initialHash: string | undefined,
) => {
	const tids: [number, number] = [rawTeams[0].tid, rawTeams[1].tid];
	const pids: [number[], number[]] = [rawTeams[0].pids, rawTeams[1].pids];
	const dpids: [number[], number[]] = [rawTeams[0].dpids, rawTeams[1].dpids];

	const teams: TradeEventTeams = [
		{
			assets: [],
		},
		{
			assets: [],
		},
	];

	const playerTransactionInfo = new Map<Player, { fromTid: number }>();

	const undoInfoPlayers = new Map<
		number,
		{
			jerseyNumber: string | undefined;
			ptModifier: number;
			rosterOrder: number;
		}
	>();
	type UndoInfoTeams = {
		depth?: Team["depth"];
		numPlayersTradedAway?: TeamSeason["numPlayersTradedAway"];
	};
	const undoInfoTeams: [UndoInfoTeams, UndoInfoTeams] = [{}, {}];

	for (const j of [0, 1] as const) {
		const k = j === 0 ? 1 : 0;

		let teamSeason;
		if (pids[j].length > 0) {
			teamSeason = await idb.cache.teamSeasons.indexGet(
				"teamSeasonsBySeasonTid",
				[g.get("season"), tids[j]],
			);
		}

		undoInfoTeams[j].depth = (await idb.cache.teams.get(tids[j]))?.depth;
		if (teamSeason) {
			undoInfoTeams[j].numPlayersTradedAway = teamSeason.numPlayersTradedAway;
		}

		const players = await idb.getCopies.players(
			{ pids: pids[j] },
			"noCopyCache",
		);
		if (players.length !== pids[j].length) {
			throw new Error("Invalid pid");
		}

		const duringSeason = g.get("phase") <= PHASE.PLAYOFFS;

		for (const p of players) {
			p.tid = tids[k];

			// p.gamesUntilTradable = 14; // Don't make traded players untradable
			p.ptModifier = 1; // Reset

			undoInfoPlayers.set(p.pid, {
				jerseyNumber: p.jerseyNumber,
				ptModifier: p.ptModifier,
				rosterOrder: p.rosterOrder,
			});

			if (duringSeason) {
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

			playerTransactionInfo.set(p, { fromTid: tids[j] });

			await idb.cache.players.put(p);

			teams[k].assets.push({
				pid: p.pid,
				name: `${p.firstName} ${p.lastName}`,
				contract: p.contract,
				ratingsIndex: p.ratings.length - 1,
				statsIndex: p.stats.length - (duringSeason ? 0 : 1), // Used to always have 1 subtracted from it until addStatsRow was removed. This is kind of weird - statsIndex references the first stats row for the new team for trades before the playoffs end, and the last stats row for the old team for trades after the playoffs. This logic is kept just to maintain backwards compatibility, it's handled in tradeSummary.ts too.
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

	// Need to reset roserOrder for other players on roster on undo
	const undoInfoOtherPlayers = new Map<number, { rosterOrder: number }>();
	for (const j of [0, 1] as const) {
		const otherPlayers = (
			await idb.cache.players.indexGetAll("playersByTid", tids[j])
		).filter((p) => !undoInfoPlayers.has(p.pid));
		for (const p of otherPlayers) {
			undoInfoOtherPlayers.set(p.pid, { rosterOrder: p.rosterOrder });
		}
	}

	let pidsEvent = [...pids[0], ...pids[1]];
	const dpidsEvent = [...dpids[0], ...dpids[1]];

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

	// Can only do this now, after we know the eid
	for (const [p, info] of playerTransactionInfo) {
		if (!p.transactions) {
			p.transactions = [];
		}
		p.transactions.push({
			season: g.get("season"),
			phase: g.get("phase"),
			tid: p.tid,
			type: "trade",
			fromTid: info.fromTid,
			eid,
		});
	}

	await toUI("realtimeUpdate", [["playerMovement"]]);
	await recomputeLocalUITeamOvrs();

	// If draft pick was changed...
	if (g.get("phase") === PHASE.DRAFT) {
		await updatePlayMenu();
	}

	const savedTrade =
		initialHash !== undefined
			? await idb.cache.savedTrades.get(initialHash)
			: undefined;

	const undo = async () => {
		// Collect assets
		const players: [Player[], Player[]] = [[], []];
		const draftPicks: [DraftPick[], DraftPick[]] = [[], []];
		for (const i of [0, 1] as const) {
			const j = i === 0 ? 1 : 0;
			players[i] = await idb.getCopies.players(
				{ pids: pids[i] },
				"noCopyCache",
			);
			if (players[i].length !== pids[i].length) {
				return false;
			}
			for (const p of players[i]) {
				if (p.tid !== tids[j]) {
					return false;
				}
			}

			for (const dpid of dpids[i]) {
				const dp = await idb.cache.draftPicks.get(dpid);
				if (!dp) {
					return false;
				}
				draftPicks[i].push(dp);
			}
			for (const dp of draftPicks[i]) {
				if (dp.tid !== tids[j]) {
					return false;
				}
			}
		}

		// Revert trade
		for (const i of [0, 1] as const) {
			for (const p of players[i]) {
				p.tid = tids[i];

				p.transactions = p.transactions?.filter(
					(row) => row.type !== "trade" || row.eid !== eid,
				);

				const info = undoInfoPlayers.get(p.pid);
				if (info) {
					Object.assign(p, info);
				}

				await idb.cache.players.put(p);
			}

			for (const dp of draftPicks[i]) {
				dp.tid = tids[i];
				await idb.cache.draftPicks.put(dp);
			}
		}

		// Restore other various state

		for (const [pid, info] of undoInfoOtherPlayers) {
			const p = await idb.cache.players.get(pid);
			if (p) {
				Object.assign(p, info);
				await idb.cache.players.put(p);
			}
		}

		await idb.cache.trade.put({
			rid: 0,
			teams: rawTeams,
		});

		if (savedTrade !== undefined) {
			await idb.cache.savedTrades.put(savedTrade);
		}

		for (const i of [0, 1] as const) {
			const undoInfoTeam = undoInfoTeams[i];
			if (undoInfoTeam.depth) {
				const t = await idb.cache.teams.get(tids[i]);
				if (t) {
					t.depth = undoInfoTeam.depth;
					await idb.cache.teams.put(t);
				}
			}
			if (undoInfoTeam.numPlayersTradedAway !== undefined) {
				const teamSeason = await idb.cache.teamSeasons.indexGet(
					"teamSeasonsBySeasonTid",
					[g.get("season"), tids[i]],
				);
				if (teamSeason) {
					teamSeason.numPlayersTradedAway = undoInfoTeam.numPlayersTradedAway;
					await idb.cache.teamSeasons.put(teamSeason);
				}
			}
		}

		await idb.cache.events.delete(eid);

		void toUI("realtimeUpdate", [["playerMovement"]]);
		void recomputeLocalUITeamOvrs();

		return true;
	};

	return undo;
};

export default processTrade;
