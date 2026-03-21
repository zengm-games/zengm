import { PHASE } from "../../common/constants.ts";
import { bySport } from "../../common/index.ts";
import type { TradeTeams } from "../../common/types.ts";
import type { AgentGameContext } from "./agentGameState.ts";
import toWorker from "./toWorker.ts";

const trimStandings = (data: any) => {
	if (!data?.rankingGroups?.league?.[0]) {
		return { error: "No standings data returned." };
	}

	const teams = data.rankingGroups.league[0].map((t: any) => ({
		abbrev: t.abbrev,
		name: `${t.region} ${t.name}`,
		won: t.seasonAttrs.won,
		lost: t.seasonAttrs.lost,
		tied: t.seasonAttrs.tied,
		otl: t.seasonAttrs.otl,
		winp: t.seasonAttrs.winp,
		rank: t.rank?.league,
	}));

	return {
		season: data.season,
		standingsType: data.type,
		teams,
	};
};

const trimFreeAgents = (data: any) => {
	if (!data) {
		return { error: "No free agent data returned." };
	}

	if (!Array.isArray(data.players)) {
		return { error: "No players in free agent list." };
	}

	const players = data.players.slice(0, 80).map((p: any) => ({
		pid: p.pid,
		name: `${p.firstName} ${p.lastName}`,
		age: p.age,
		pos: p.ratings?.pos,
		ovr: p.ratings?.ovr,
		contract: p.contract
			? {
					amount: p.contract.amount,
					exp: p.contract.exp,
				}
			: undefined,
	}));

	return {
		capSpace: data.capSpace,
		payroll: data.payroll,
		numRosterSpots: data.numRosterSpots,
		players,
	};
};

const resolveRosterAbbrevParam = (
	ctx: AgentGameContext,
	teamAbbrev: string | undefined,
): { abbrev: string } | { error: string } => {
	const trimmed = teamAbbrev?.trim();
	if (!trimmed) {
		if (ctx.userTeamAbbrev === null) {
			return { error: "Could not resolve user team abbreviation." };
		}
		return { abbrev: `${ctx.userTeamAbbrev}_${ctx.userTid}` };
	}

	const lower = trimmed.toLowerCase();
	const match = ctx.teamsIndex.find((t) => t.abbrev.toLowerCase() === lower);
	if (!match) {
		return { error: `Unknown team abbreviation: ${teamAbbrev}` };
	}
	return { abbrev: `${match.abbrev}_${match.tid}` };
};

export const runAgentGetStandings = async (
	ctx: AgentGameContext,
	input: { season?: number },
) => {
	const season = input.season ?? ctx.season;
	const standingsType = bySport({
		baseball: "div" as const,
		basketball: "conf" as const,
		football: "div" as const,
		hockey: "div" as const,
	});

	const result = await toWorker("main", "runBefore", {
		viewId: "standings",
		params: {
			season: String(season),
			type: standingsType,
		},
		ctxBBGM: {},
		updateEvents: [],
		prevData: {},
	});

	if (result === undefined) {
		return { error: "League not ready. Open a league and try again." };
	}

	return trimStandings(result);
};

export const runAgentGetRoster = async (
	ctx: AgentGameContext,
	input: { teamAbbrev?: string } = {},
) => {
	const resolved = resolveRosterAbbrevParam(ctx, input.teamAbbrev);
	if ("error" in resolved) {
		return { error: resolved.error };
	}

	const result = await toWorker("main", "runBefore", {
		viewId: "roster",
		params: {
			abbrev: resolved.abbrev,
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

export const runAgentGetAvailablePlayers = async () => {
	const result = await toWorker("main", "runBefore", {
		viewId: "freeAgents",
		params: {
			season: "current",
			type: "available",
		},
		ctxBBGM: {},
		updateEvents: [],
		prevData: {},
	});

	if (result === undefined) {
		return { error: "League not ready. Open a league and try again." };
	}

	return trimFreeAgents(result);
};

export const runAgentGetPlayer = async (input: { pid: number }) => {
	const pid = input.pid;
	if (!Number.isInteger(pid) || pid < 0) {
		return { error: "Invalid player id." };
	}

	const result = await toWorker("main", "runBefore", {
		viewId: "player",
		params: {
			pid: String(pid),
		},
		ctxBBGM: {},
		updateEvents: [],
		prevData: {},
	});

	if (result === undefined) {
		return { error: "League not ready. Open a league and try again." };
	}

	const view = result as {
		errorMessage?: string;
		player?: unknown;
		[key: string]: unknown;
	};

	if (view.errorMessage) {
		return { error: view.errorMessage };
	}

	if (view.player === undefined) {
		return { error: "No player data returned." };
	}

	return view;
};

export const runAgentSortRoster = async (input: { pos?: string }) => {
	await toWorker(
		"main",
		"autoSortRoster",
		input.pos ? { pos: input.pos } : undefined,
	);
	return { ok: true as const };
};

export const runAgentUpdatePlayingTime = async (input: {
	pid: number;
	ptModifier: "0" | "0.75" | "1" | "1.25" | "1.5";
}) => {
	const ptModifier = Number(input.ptModifier) as
		| 0
		| 0.75
		| 1
		| 1.25
		| 1.5;
	try {
		await toWorker("main", "updatePlayingTime", {
			pid: input.pid,
			ptModifier,
		});
		return { ok: true as const, pid: input.pid, ptModifier };
	} catch (error) {
		return {
			error: error instanceof Error ? error.message : String(error),
		};
	}
};

export const runAgentReleasePlayer = async (
	ctx: AgentGameContext,
	input: { pid: number },
) => {
	if (ctx.spectator) {
		return { error: "Spectator mode cannot release players." };
	}

	const msg = await toWorker("main", "releasePlayer", {
		pids: [input.pid],
	});
	if (typeof msg === "string") {
		return { error: msg };
	}
	return { ok: true as const, releasedPid: input.pid };
};

export const runAgentDraftPick = async (
	ctx: AgentGameContext,
	input: { pid: number },
) => {
	if (ctx.spectator) {
		return { error: "Spectator mode cannot draft." };
	}
	if (ctx.phase !== PHASE.DRAFT && ctx.phase !== PHASE.FANTASY_DRAFT) {
		return { error: "Not in a draft phase." };
	}

	await toWorker("main", "draftUser", input.pid);
	return { ok: true as const, pid: input.pid };
};

export const runAgentProposeTrade = async (
	ctx: AgentGameContext,
	input: {
		otherTeamAbbrev: string;
		userPids?: number[];
		userDpids?: number[];
		otherPids?: number[];
		otherDpids?: number[];
	},
) => {
	if (ctx.spectator) {
		return { error: "Spectator mode cannot trade." };
	}

	const lower = input.otherTeamAbbrev.trim().toLowerCase();
	const match = ctx.teamsIndex.find((t) => t.abbrev.toLowerCase() === lower);
	if (!match) {
		return { error: `Unknown team: ${input.otherTeamAbbrev}` };
	}
	if (match.tid === ctx.userTid) {
		return { error: "Cannot trade with your own team." };
	}

	const userPids = input.userPids ?? [];
	const userDpids = input.userDpids ?? [];
	const otherPids = input.otherPids ?? [];
	const otherDpids = input.otherDpids ?? [];

	const teams: TradeTeams = [
		{
			tid: ctx.userTid,
			pids: userPids,
			pidsExcluded: [],
			dpids: userDpids,
			dpidsExcluded: [],
		},
		{
			tid: match.tid,
			pids: otherPids,
			pidsExcluded: [],
			dpids: otherDpids,
			dpidsExcluded: [],
		},
	];

	await toWorker("main", "clearTrade", "all");
	await toWorker("main", "createTrade", teams);
	const output = await toWorker("main", "proposeTrade", false);

	return {
		ok: true as const,
		otherTeamAbbrev: match.abbrev,
		tradeProposalResult: output ?? null,
	};
};
