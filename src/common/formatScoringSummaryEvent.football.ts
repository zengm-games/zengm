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
		(event as any).safety ||
		(event as any).td ||
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
