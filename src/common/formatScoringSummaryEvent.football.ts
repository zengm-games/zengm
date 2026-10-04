import type {
	PlayByPlayEventOutput,
	PlayByPlayEventScore,
} from "../worker/core/GameSim.football/PlayByPlayLogger.ts";
import type { PlayByPlayEvent } from "../worker/core/GameSim/PlayByPlayLoggerBase.ts";

export const formatScoringSummaryEvent = (
	event: PlayByPlayEvent<PlayByPlayEventOutput>,
	period: number,
): PlayByPlayEventScore | undefined => {
	if (
		("safety" in event && event.safety) ||
		("td" in event && event.td) ||
		event.type === "extraPoint" ||
		event.type === "twoPointConversionFailed" ||
		// Include missed FGs
		event.type === "fieldGoal" ||
		event.type === "shootoutShot"
	) {
		const scoringSummaryEvent = {
			...event,
			quarter: period,
		} as PlayByPlayEventScore;

		return scoringSummaryEvent;
	}
};
