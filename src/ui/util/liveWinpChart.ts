import { getLiveWinp } from "./getLiveWinp.ts";

// Maps live game state to a game-progress x position for the Pomymarket win chart. This is not the time-left fraction from getLiveWinp, because that one restarts every overtime period and extra inning and so would run backwards.

const BASEBALL_OUTS_PER_HALF_INNING = 3;

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

// Line colors are each team's main color, but a dark color vanishes in the dark theme, a light color vanishes in the light theme, and two similar colors can't be told apart
const MIN_LUMINANCE = 0.05;
const MAX_LUMINANCE = 0.5;
const MIN_COLOR_DISTANCE = 80;
export const FALLBACK_LINE_COLORS = [
	"var(--bs-primary)",
	"var(--bs-secondary)",
] as const;

const hexToRgb = (hex: string) => {
	const match = /^#?([\da-f]{2})([\da-f]{2})([\da-f]{2})$/i.exec(hex);
	if (!match) {
		return;
	}
	return [
		Number.parseInt(match[1]!, 16),
		Number.parseInt(match[2]!, 16),
		Number.parseInt(match[3]!, 16),
	] as const;
};

const getLuminance = (rgb: readonly [number, number, number]) => {
	const [r, g, b] = rgb.map((value) => {
		const channel = value / 255;
		return channel <= 0.03928
			? channel / 12.92
			: ((channel + 0.055) / 1.055) ** 2.4;
	}) as [number, number, number];
	return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

const getVisibleColors = (colors: readonly string[]) => {
	return colors.filter((color) => {
		const rgb = hexToRgb(color);
		if (!rgb) {
			return false;
		}
		const luminance = getLuminance(rgb);
		return luminance >= MIN_LUMINANCE && luminance <= MAX_LUMINANCE;
	});
};

const getColorDistance = (a: string, b: string) => {
	const rgbA = hexToRgb(a)!;
	const rgbB = hexToRgb(b)!;
	return Math.hypot(rgbA[0] - rgbB[0], rgbA[1] - rgbB[1], rgbA[2] - rgbB[2]);
};

export const getLineColors = (
	colors: [readonly string[], readonly string[]],
): [string, string] => {
	const visible0 = getVisibleColors(colors[0]);
	const visible1 = getVisibleColors(colors[1]);
	const color0 = visible0[0] ?? FALLBACK_LINE_COLORS[0];
	const color1 =
		visible0[0] === undefined
			? visible1[0]
			: visible1.find(
					(color) => getColorDistance(color0, color) >= MIN_COLOR_DISTANCE,
				);
	return [color0, color1 ?? FALLBACK_LINE_COLORS[1]];
};

// Label centers for the two lines' right-edge labels, as probabilities. Labels closer than minGap are pushed apart around their midpoint and kept inside [minGap / 2, 1 - minGap / 2], so they never overlap or leave the chart.
export const getLabelYs = (
	probs: [number, number],
	minGap: number,
): [number, number] => {
	const hi = probs[0] >= probs[1] ? 0 : 1;
	const lo = hi === 0 ? 1 : 0;
	let yHi = probs[hi];
	let yLo = probs[lo];
	if (yHi - yLo < minGap) {
		const mid = (yHi + yLo) / 2;
		yHi = mid + minGap / 2;
		yLo = mid - minGap / 2;
	}
	const pad = minGap / 2;
	if (yHi > 1 - pad) {
		yLo -= yHi - (1 - pad);
		yHi = 1 - pad;
	}
	if (yLo < pad) {
		yHi += pad - yLo;
		yLo = pad;
	}
	const ys: [number, number] = [0, 0];
	ys[hi] = yHi;
	ys[lo] = yLo;
	return ys;
};
