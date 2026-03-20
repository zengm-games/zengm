import { bySport } from "../../common/index.ts";
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

const trimRoster = (data: any) => {
	if (data?.errorMessage) {
		return { error: data.errorMessage };
	}

	if (!Array.isArray(data?.players)) {
		return { error: "No roster data returned." };
	}

	const players = data.players.map((p: any) => ({
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
		injury: p.injury && p.injury.type !== "Healthy" ? p.injury : undefined,
	}));

	return {
		team: data.t?.region
			? `${data.t.region} ${data.t.name}`
			: undefined,
		payroll: data.payroll,
		players,
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

export const runAgentGetRoster = async (ctx: AgentGameContext) => {
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

	return trimRoster(result);
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
