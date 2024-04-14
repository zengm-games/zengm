import type {
	PlayByPlayEvent,
	PlayByPlayEventInput,
	PlayByPlayEventScore,
} from "../worker/core/GameSim.baseball/PlayByPlayLogger";

export const formatScoringSummaryEvent = (
	event: PlayByPlayEventInput,
	period: number,
) => {
	let scored = false;
	if (event.type === "hitResult" && event.numBases === 4) {
		// Home run
		scored = true;
	} else if (event.type === "shootoutShot") {
		scored = true;
	} else {
		const runners = (event as Extract<PlayByPlayEvent, { type: "hitResult" }>)
			.runners;
		if (runners?.some(runner => runner.scored)) {
			scored = true;
		}
	}

	if (scored) {
		const scoringSummaryEvent = {
			...event,
			inning: period,
		} as PlayByPlayEventScore;
		if (
			scoringSummaryEvent.type === "balk" ||
			scoringSummaryEvent.type === "wildPitch" ||
			scoringSummaryEvent.type === "passedBall"
		) {
			// Swap team, so it shows up correctly in scoring summary. Basically, t must be team that scored
			scoringSummaryEvent.t = scoringSummaryEvent.t === 0 ? 1 : 0;
		}

		return scoringSummaryEvent;
	}
};
