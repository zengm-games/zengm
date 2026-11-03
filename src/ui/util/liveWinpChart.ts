import { getLiveWinp } from "./getLiveWinp.ts";

// Maps live game state to a game-progress x position for the Pomymarket win chart. This is not the time-left fraction from getLiveWinp, because that one restarts every overtime period and extra inning and so would run backwards.

const BASEBALL_OUTS_PER_HALF_INNING = 3;

// Elam endings and shootouts have no clock, so they move x by a share of regulation
const ELAM_FALLBACK_SPAN_FRACTION = 0.05;
const SHOOTOUT_STEP_FRACTION = 0.01;

export type LiveWinpXState = {
	x: number;
	elam?: {
		pts: number;
		span: number;
		x: number;
	};
	shootout?: {
		x: number;
	};
};

export const INITIAL_LIVE_WINP_X_STATE: LiveWinpXState = { x: 0 };

// Seconds for clock sports, outs for baseball
const getRegulationLength = ({
	numPeriods,
	quarterLength,
}: {
	numPeriods: number;
	quarterLength: number;
}) => {
	if (__SPORT === "baseball") {
		return numPeriods * 2 * BASEBALL_OUTS_PER_HALF_INNING;
	}
	return numPeriods * quarterLength * 60;
};

// Never 0, so steps sized from it still move
const getStepBase = ({
	numPeriods,
	quarterLength,
}: {
	numPeriods: number;
	quarterLength: number;
}) => {
	return (
		getRegulationLength({ numPeriods, quarterLength }) ||
		quarterLength * 60 ||
		1
	);
};

const getBaseballOuts = (boxScore: any, outs: number) => {
	const inning = boxScore.teams[1].ptsQtrs.length;
	if (inning === 0) {
		return 0;
	}
	const bottom = boxScore.teams[0].ptsQtrs.length === inning;
	const halfInningsDone = 2 * (inning - 1) + (bottom ? 1 : 0);
	return halfInningsDone * BASEBALL_OUTS_PER_HALF_INNING + outs;
};

export const advanceLiveWinpX = ({
	boxScore,
	elapsedSeconds,
	quarterLength,
	sportState,
	state,
}: {
	boxScore: any;
	elapsedSeconds: number;
	quarterLength: number;
	sportState: any;
	state: LiveWinpXState;
}): LiveWinpXState => {
	const { numPeriods } = boxScore;
	const stepBase = getStepBase({ numPeriods, quarterLength });

	if (boxScore.shootout) {
		const shootout = state.shootout ?? { x: state.x };
		const attempts =
			(boxScore.teams[0].sAtt ?? 0) + (boxScore.teams[1].sAtt ?? 0);
		return {
			...state,
			shootout,
			x: Math.max(
				state.x,
				shootout.x + attempts * SHOOTOUT_STEP_FRACTION * stepBase,
			),
		};
	}

	if (__SPORT === "baseball") {
		return {
			...state,
			x: Math.max(state.x, getBaseballOuts(boxScore, sportState?.outs ?? 0)),
		};
	}

	if (boxScore.elamTarget !== undefined) {
		const leaderPts = Math.max(boxScore.teams[0].pts, boxScore.teams[1].pts);
		let elam = state.elam;
		if (!elam) {
			const regulationLeft =
				getRegulationLength({ numPeriods, quarterLength }) - state.x;
			elam = {
				pts: leaderPts,
				span:
					regulationLeft > 0
						? regulationLeft
						: ELAM_FALLBACK_SPAN_FRACTION * stepBase,
				x: state.x,
			};
		}
		const pointsNeeded = boxScore.elamTarget - elam.pts;
		const progress =
			pointsNeeded > 0
				? Math.min(1, Math.max(0, (leaderPts - elam.pts) / pointsNeeded))
				: 1;
		return {
			...state,
			elam,
			x: Math.max(state.x, elam.x + progress * elam.span),
		};
	}

	if (!Number.isFinite(elapsedSeconds) || elapsedSeconds <= 0) {
		return state;
	}

	return {
		...state,
		x: state.x + elapsedSeconds,
	};
};

export type LiveWinpSample = {
	// Probability that teams[0] wins
	prob: number;
	x: number;
};

// Exhibition games and games without team ovrs get no samples, matching the live percentages under the score
export const getNextLiveWinpSample = ({
	boxScore,
	elapsedSeconds,
	homeCourtAdvantage,
	quarterLength,
	sportState,
	xState,
}: {
	boxScore: any;
	elapsedSeconds: number;
	homeCourtAdvantage: number;
	quarterLength: number;
	sportState: any;
	xState: LiveWinpXState;
}) => {
	if (boxScore.exhibition) {
		return;
	}

	const liveWinp = getLiveWinp({
		boxScore,
		homeCourtAdvantage,
		quarterLength,
		sportState,
	});
	if (!liveWinp) {
		return;
	}

	const nextXState = advanceLiveWinpX({
		boxScore,
		elapsedSeconds,
		quarterLength,
		sportState,
		state: xState,
	});

	return {
		sample: { prob: liveWinp.prob, x: nextXState.x },
		xState: nextXState,
	};
};

// Right edge of the x-axis: regulation until overtime pushes past it
export const getLiveWinpXDomain = ({
	boxScore,
	quarterLength,
	x,
}: {
	boxScore: any;
	quarterLength: number;
	x: number;
}) => {
	return Math.max(
		getRegulationLength({ numPeriods: boxScore.numPeriods, quarterLength }),
		x,
		1,
	);
};
