import type {
	PlayByPlayEvent,
	PlayByPlayEventScore,
} from "../worker/core/GameSim.football/PlayByPlayLogger";

export const formatScoringSummaryEvent = (
	event: PlayByPlayEvent,
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
