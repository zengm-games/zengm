import type {
	PlayByPlayEvent,
	PlayByPlayEventScore,
} from "../worker/core/GameSim.hockey/PlayByPlayLogger";

export const formatScoringSummaryEvent = (
	event: PlayByPlayEvent,
): PlayByPlayEventScore | undefined => {
	if (event.type === "goal" || event.type === "shootoutShot") {
		return event;
	}
};
