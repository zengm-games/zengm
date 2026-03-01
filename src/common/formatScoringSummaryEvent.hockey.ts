import type {
	PlayByPlayEventOutput,
	PlayByPlayEventScore,
} from "../worker/core/GameSim.hockey/PlayByPlayLogger.ts";
import type { PlayByPlayEvent } from "../worker/core/GameSim/PlayByPlayLoggerBase.ts";

export const formatScoringSummaryEvent = (
	event: PlayByPlayEvent<PlayByPlayEventOutput>,
): PlayByPlayEventScore | undefined => {
	if (event.type === "goal" || event.type === "shootoutShot") {
		return event;
	}
};
