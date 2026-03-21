import type { TradeTeams } from "../../common/types.ts";
import type { EntityContext } from "./agentChatUi.ts";
import type { AgentGameContext } from "./agentGameState.ts";
import toWorker from "./toWorker.ts";

export const runGmGetMyRoster = async (
	entity: EntityContext,
	ctx: AgentGameContext,
) => {
	const result = await toWorker("main", "runBefore", {
		viewId: "roster",
		params: {
			abbrev: `${entity.abbrev}_${entity.tid}`,
			season: String(ctx.season),
			playoffs: "regularSeason",
		},
		ctxBBGM: {},
		updateEvents: [],
		prevData: {},
	});

	if (result === undefined) {
		return { error: "League not ready. Open a league and try again." };
	}

	const rosterView = result as {
		errorMessage?: string;
		players?: unknown;
		[key: string]: unknown;
	};
	if (rosterView.errorMessage) {
		return { error: rosterView.errorMessage };
	}
	if (!Array.isArray(rosterView.players)) {
		return { error: "No roster data returned." };
	}

	return rosterView;
};

export const runGmGetUserTeamRoster = async (ctx: AgentGameContext) => {
	if (ctx.userTeamAbbrev === null) {
		return { error: "Could not resolve user team abbreviation." };
	}

	const result = await toWorker("main", "runBefore", {
		viewId: "roster",
		params: {
			abbrev: `${ctx.userTeamAbbrev}_${ctx.userTid}`,
			season: String(ctx.season),
			playoffs: "regularSeason",
		},
		ctxBBGM: {},
		updateEvents: [],
		prevData: {},
	});

	if (result === undefined) {
		return { error: "League not ready. Open a league and try again." };
	}

	const rosterView = result as {
		errorMessage?: string;
		players?: unknown;
		[key: string]: unknown;
	};
	if (rosterView.errorMessage) {
		return { error: rosterView.errorMessage };
	}
	if (!Array.isArray(rosterView.players)) {
		return { error: "No roster data returned." };
	}

	return rosterView;
};

type GmTradeAssetInput = {
	myPids?: number[];
	myDpids?: number[];
	userPids?: number[];
	userDpids?: number[];
};

export const runGmEvaluateTrade = async (
	entity: EntityContext,
	ctx: AgentGameContext,
	input: GmTradeAssetInput,
) => {
	void ctx;
	const result = await toWorker("main", "evaluateTradeValue", {
		tid: entity.tid,
		userPids: input.userPids ?? [],
		userDpids: input.userDpids ?? [],
		otherPids: input.myPids ?? [],
		otherDpids: input.myDpids ?? [],
	});

	if (result === undefined) {
		return { error: "League not ready. Open a league and try again." };
	}

	return result as { dv: number; summary: string };
};

export const runGmAcceptTrade = async (
	entity: EntityContext,
	ctx: AgentGameContext,
	input: GmTradeAssetInput,
) => {
	if (ctx.spectator) {
		return { error: "Spectator mode cannot trade." };
	}

	const evaluated = await runGmEvaluateTrade(entity, ctx, input);
	if ("error" in evaluated) {
		return evaluated;
	}
	if (evaluated.dv < -5) {
		return { error: "Trade rejected: significantly unfavorable." };
	}

	const teams: TradeTeams = [
		{
			tid: ctx.userTid,
			pids: input.userPids ?? [],
			pidsExcluded: [],
			dpids: input.userDpids ?? [],
			dpidsExcluded: [],
		},
		{
			tid: entity.tid,
			pids: input.myPids ?? [],
			pidsExcluded: [],
			dpids: input.myDpids ?? [],
			dpidsExcluded: [],
		},
	];

	await toWorker("main", "clearTrade", "all");
	await toWorker("main", "createTrade", teams);
	const output = await toWorker("main", "proposeTrade", true);

	return { ok: true as const, tradeResult: output ?? null };
};
