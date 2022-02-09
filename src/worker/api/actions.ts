import { PHASE } from "../../common";
import { contractNegotiation, draft, game, season, trade } from "../core";
import { idb } from "../db";
import { g, helpers, logEvent, toUI, updateStatus } from "../util";
import type { Conditions, TradeTeams } from "../../common/types";

const negotiate = async (pid: number, conditions: Conditions) => {
	// If there is no active negotiation with this pid, create it
	const negotiation = await idb.cache.negotiations.get(pid);

	if (!negotiation) {
		const errorMsg = await contractNegotiation.create(pid, false);

		if (errorMsg !== undefined && errorMsg) {
			logEvent(
				{
					type: "error",
					text: errorMsg,
					saveToDb: false,
				},
				conditions,
			);
		} else {
			toUI(
				"realtimeUpdate",
				[[], helpers.leagueUrl(["negotiation", pid])],
				conditions,
			);
		}
	} else {
		toUI(
			"realtimeUpdate",
			[[], helpers.leagueUrl(["negotiation", pid])],
			conditions,
		);
	}
};

type TradeForOptions = {
	dpid?: number;
	pid?: number;
	otherDpids?: number[];
	otherPids?: number[];
	tid?: number;
	userDpids?: number[];
	userPids?: number[];
};

const tradeFor = async (arg: TradeForOptions, conditions: Conditions) => {
	let teams: TradeTeams | undefined;

	if (arg.pid !== undefined) {
		const p = await idb.cache.players.get(arg.pid);

		if (!p || p.tid < 0) {
			return;
		}

		// Start new trade for a single player, like a Trade For button
		teams = [
			{
				tid: g.get("userTid"),
				pids: [],
				pidsExcluded: [],
				dpids: [],
				dpidsExcluded: [],
			},
			{
				tid: p.tid,
				pids: [arg.pid],
				pidsExcluded: [],
				dpids: [],
				dpidsExcluded: [],
			},
		];
	} else if (arg.dpid !== undefined) {
		const dp = await idb.cache.draftPicks.get(arg.dpid);

		if (!dp) {
			return;
		}

		// Start new trade for a single player, like a Trade For button
		teams = [
			{
				tid: g.get("userTid"),
				pids: [],
				pidsExcluded: [],
				dpids: [],
				dpidsExcluded: [],
			},
			{
				tid: dp.tid,
				pids: [],
				pidsExcluded: [],
				dpids: [arg.dpid],
				dpidsExcluded: [],
			},
		];
	} else if (
		arg.userPids &&
		arg.userDpids &&
		arg.otherPids &&
		arg.otherDpids &&
		arg.tid !== undefined
	) {
		// Start a new trade with everything specified, from the trading block
		teams = [
			{
				tid: g.get("userTid"),
				pids: arg.userPids,
				pidsExcluded: [],
				dpids: arg.userDpids,
				dpidsExcluded: [],
			},
			{
				tid: arg.tid,
				pids: arg.otherPids,
				pidsExcluded: [],
				dpids: arg.otherDpids,
				dpidsExcluded: [],
			},
		];
	} else if (arg.tid !== undefined) {
		// Start trade with team, like from League Finances
		teams = [
			{
				tid: g.get("userTid"),
				pids: [],
				pidsExcluded: [],
				dpids: [],
				dpidsExcluded: [],
			},
			{
				tid: arg.tid,
				pids: [],
				pidsExcluded: [],
				dpids: [],
				dpidsExcluded: [],
			},
		];
	}

	// Start a new trade based on a list of pids and dpids, like from the trading block
	if (teams) {
		await trade.create(teams);
		toUI("realtimeUpdate", [[], helpers.leagueUrl(["trade"])], conditions);
	}
};

export const runDraft = async (
	action: Parameters<typeof draft.runPicks>[0],
	conditions: Conditions,
) => {
	if (
		g.get("phase") === PHASE.DRAFT ||
		g.get("phase") === PHASE.FANTASY_DRAFT ||
		g.get("phase") === PHASE.EXPANSION_DRAFT
	) {
		await updateStatus("Draft in progress...");
		await draft.runPicks(action, conditions);
		const draftPicks = await draft.getOrder();

		if (draftPicks.length === 0) {
			await updateStatus("Idle");
		}
	}
};

const untilPick = async (dpid: number, conditions: Conditions) => {
	await runDraft({ type: "untilPick", dpid }, conditions);
};

const addToTradingBlock = async (pid: number, conditions: Conditions) => {
	toUI(
		"realtimeUpdate",
		[[], helpers.leagueUrl(["trading_block"]), { pid }],
		conditions,
	);
};

const liveGame = async (gid: number, conditions: Conditions) => {
	await toUI(
		"realtimeUpdate",
		[
			[],
			helpers.leagueUrl(["live_game"]),
			{
				fromAction: true,
			},
		],
		conditions,
	);
	game.play(1, conditions, true, gid, true);
};

const simGame = async (gid: number, conditions: Conditions) => {
	await game.play(1, conditions, true, gid);
};

const simToGame = async (gid: number, conditions: Conditions) => {
	const numDays = await season.getDaysLeftSchedule(gid);
	await updateStatus("Playing..."); // For quick UI updating, before game.play
	await game.play(numDays, conditions);
};

export default {
	addToTradingBlock,
	liveGame,
	negotiate,
	simGame,
	simToGame,
	tradeFor,
	untilPick,
};
