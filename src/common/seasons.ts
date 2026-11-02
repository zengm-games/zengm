import { PHASE } from "./constants.ts";
import type { Phase } from "./types.ts";

// Rules about which seasons have data yet, shared by the UI (to build season dropdowns) and the worker (to pick a default season)

export type SeasonState = {
	season: number;
	phase: Phase;

	// During an expansion or fantasy draft, phase is temporarily negative and nextPhase is the actual phase of the season
	nextPhase: Phase | undefined;
};

const getActualPhase = ({ phase, nextPhase }: SeasonState) =>
	nextPhase ?? phase;

// Season awards and history are set after the playoffs
export const isCurrentSeasonComplete = (state: SeasonState) =>
	getActualPhase(state) > PHASE.PLAYOFFS;

export const hasCurrentSeasonDraftHappened = (state: SeasonState) =>
	getActualPhase(state) >= PHASE.DRAFT;

// Players with contracts expiring this season are upcoming free agents until re-signing players is over, then it's next season
export const getFirstUpcomingFreeAgentsSeason = (state: SeasonState) =>
	getActualPhase(state) <= PHASE.RESIGN_PLAYERS
		? state.season
		: state.season + 1;
