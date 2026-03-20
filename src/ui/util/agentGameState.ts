import type { LocalStateUI } from "../../common/types.ts";

export type AgentGameContext = {
	phase: number;
	phaseText: string;
	season: number;
	lid?: number;
	userTid: number;
	userTids: number[];
	spectator: boolean;
	userTeamAbbrev: string | null;
	userTeamName: string | null;
	statusText: string;
};

/**
 * Lightweight snapshot from UI Zustand state for the system prompt and chat request body.
 * Avoids extra worker round-trips for data that is already on the main thread.
 */
export const serializeAgentGameState = (
	state: Pick<
		LocalStateUI,
		| "phase"
		| "phaseText"
		| "season"
		| "lid"
		| "userTid"
		| "userTids"
		| "spectator"
		| "teamInfoCache"
		| "statusText"
	>,
): AgentGameContext => {
	const t = state.teamInfoCache[state.userTid];
	return {
		phase: state.phase,
		phaseText: state.phaseText,
		season: state.season,
		lid: state.lid,
		userTid: state.userTid,
		userTids: state.userTids,
		spectator: state.spectator,
		userTeamAbbrev: t?.abbrev ?? null,
		userTeamName: t ? `${t.region} ${t.name}` : null,
		statusText: state.statusText,
	};
};
