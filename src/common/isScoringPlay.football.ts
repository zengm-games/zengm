import type {
	PlayByPlayEvent,
	PlayByPlayEventInputScore,
} from "../worker/core/GameSim.football/PlayByPlayLogger";

export const isScoringPlay = (
	event: PlayByPlayEvent,
): event is PlayByPlayEventInputScore => {
	return (
		(event as any).safety ||
		(event as any).td ||
		event.type === "extraPoint" ||
		event.type === "twoPointConversionFailed" ||
		// Include missed FGs
		event.type === "fieldGoal" ||
		event.type === "shootoutShot"
	);
};
