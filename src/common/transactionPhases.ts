import { PHASE } from "./constants.ts";
import type { Phase } from "./types.ts";

export const canTradeInPhase = (phase: Phase) =>
	phase >= 0 &&
	!(phase >= PHASE.AFTER_TRADE_DEADLINE && phase <= PHASE.PLAYOFFS);

// Re-signing your own players is handled separately
export const canSignFreeAgentsInPhase = (phase: Phase) =>
	phase >= 0 &&
	!(phase > PHASE.AFTER_TRADE_DEADLINE && phase <= PHASE.RESIGN_PLAYERS);

export type TradeBlockedReason =
	| "spectator"
	| "challengeNoTrades"
	| "otherTeamsWantToHire"
	| "phase";

// Why the user can't trade right now, or undefined if they can
export const getTradeBlockedReason = ({
	challengeNoTrades,
	gameOver,
	otherTeamsWantToHire,
	phase,
	spectator,
}: {
	challengeNoTrades: boolean;
	gameOver: boolean;
	otherTeamsWantToHire: boolean;
	phase: Phase;
	spectator: boolean;
}): TradeBlockedReason | undefined => {
	if (spectator) {
		return "spectator";
	}

	if (challengeNoTrades) {
		return "challengeNoTrades";
	}

	if (otherTeamsWantToHire) {
		return "otherTeamsWantToHire";
	}

	if (!canTradeInPhase(phase) || gameOver) {
		return "phase";
	}
};
