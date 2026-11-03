import { assert, test } from "vitest";
import {
	advanceLiveWinpX,
	getLiveWinpXDomain,
	FALLBACK_LINE_COLORS,
	getLabelYs,
	getLineColors,
	getNextLiveWinpSample,
	INITIAL_LIVE_WINP_X_STATE,
} from "./liveWinpChart.ts";

const QUARTER_LENGTH = 12;
const REGULATION_SECONDS = 4 * QUARTER_LENGTH * 60;

const makeBoxScore = ({
	pts = [0, 0],
	...rest
}: {
	pts?: [number, number];
	[key: string]: unknown;
} = {}) => ({
	numPeriods: 4,
	teams: [0, 1].map((i) => ({
		pts: pts[i],
		ptsQtrs: [0],
		sAtt: undefined as number | undefined,
	})),
	time: "6:00",
	...rest,
});

const advance = (
	state: typeof INITIAL_LIVE_WINP_X_STATE,
	boxScore: any,
	elapsedSeconds: number,
) =>
	advanceLiveWinpX({
		boxScore,
		elapsedSeconds,
		quarterLength: QUARTER_LENGTH,
		sportState: undefined,
		state,
	});

test("adds elapsed seconds during regulation", () => {
	let state = INITIAL_LIVE_WINP_X_STATE;
	for (let i = 0; i < 12; i++) {
		state = advance(state, makeBoxScore(), 30);
	}
	assert.strictEqual(state.x, 360);
	assert.strictEqual(
		getLiveWinpXDomain({
			boxScore: makeBoxScore(),
			quarterLength: QUARTER_LENGTH,
			x: state.x,
		}),
		REGULATION_SECONDS,
	);
});

test("a period rollover leaves x unchanged", () => {
	const state = advance({ x: 720 }, makeBoxScore(), -720);
	assert.strictEqual(state.x, 720);
});

test("a non-finite clock leaves x unchanged", () => {
	const state = advance({ x: 720 }, makeBoxScore(), Number.NaN);
	assert.strictEqual(state.x, 720);
});

test("overtime extends x and the domain past regulation", () => {
	let state = { x: REGULATION_SECONDS };
	let prev = state.x;
	for (let i = 0; i < 10; i++) {
		state = advance(state, makeBoxScore(), 30);
		assert.isAbove(state.x, prev);
		prev = state.x;
	}
	assert.strictEqual(state.x, REGULATION_SECONDS + 300);
	assert.strictEqual(
		getLiveWinpXDomain({
			boxScore: makeBoxScore(),
			quarterLength: QUARTER_LENGTH,
			x: state.x,
		}),
		REGULATION_SECONDS + 300,
	);
});

test("Elam ending moves x through the regulation time left, by points toward the target", () => {
	const activationX = REGULATION_SECONDS - 180;
	const span = 180;

	// First sample with the target set anchors the Elam segment, and the clock is ignored from then on
	let state = advance(
		{ x: activationX },
		makeBoxScore({ elamTarget: 124, pts: [100, 95] }),
		Number.NaN,
	);
	assert.strictEqual(state.x, activationX);

	state = advance(
		state,
		makeBoxScore({ elamTarget: 124, pts: [112, 100] }),
		Number.NaN,
	);
	assert.strictEqual(state.x, activationX + span / 2);

	state = advance(
		state,
		makeBoxScore({ elamTarget: 124, pts: [112, 124] }),
		Number.NaN,
	);
	assert.strictEqual(state.x, activationX + span);
});

test("Elam ending with no regulation time left still advances", () => {
	let state = advance(
		{ x: REGULATION_SECONDS + 60 },
		makeBoxScore({ elamTarget: 20, pts: [10, 10] }),
		Number.NaN,
	);
	const start = state.x;
	state = advance(
		state,
		makeBoxScore({ elamTarget: 20, pts: [15, 10] }),
		Number.NaN,
	);
	assert.isAbove(state.x, start);
});

test("shootout adds one step per attempt", () => {
	const startX = REGULATION_SECONDS + 300;
	const shootoutBoxScore = (sAtt: [number, number]) => {
		const boxScore = makeBoxScore({ shootout: true });
		boxScore.teams[0]!.sAtt = sAtt[0];
		boxScore.teams[1]!.sAtt = sAtt[1];
		return boxScore;
	};

	let state = advance({ x: startX }, shootoutBoxScore([0, 0]), 0);
	assert.strictEqual(state.x, startX);

	const steps = [];
	let prev = state.x;
	for (const sAtt of [
		[1, 0],
		[1, 1],
		[2, 1],
	] as [number, number][]) {
		state = advance(state, shootoutBoxScore(sAtt), 0);
		steps.push(state.x - prev);
		prev = state.x;
	}
	assert.isAbove(steps[0]!, 0);
	assert.closeTo(steps[1]!, steps[0]!, 1e-9);
	assert.closeTo(steps[2]!, steps[0]!, 1e-9);
});

test("numPeriods 0 does not divide by zero", () => {
	const boxScore = makeBoxScore({ numPeriods: 0, elamTarget: 10, pts: [0, 0] });
	let state = advance({ x: 0 }, boxScore, Number.NaN);
	state = advance(
		state,
		makeBoxScore({ numPeriods: 0, elamTarget: 10, pts: [5, 0] }),
		Number.NaN,
	);
	assert.isTrue(Number.isFinite(state.x));
	assert.isAbove(state.x, 0);
	assert.isTrue(
		Number.isFinite(
			getLiveWinpXDomain({
				boxScore,
				quarterLength: QUARTER_LENGTH,
				x: state.x,
			}),
		),
	);
});

const sampleBoxScore = (rest: Record<string, unknown> = {}) => ({
	...makeBoxScore({ pts: [80, 70] }),
	teams: [0, 1].map((i) => ({
		ovr: 55,
		pts: i === 0 ? 80 : 70,
		ptsQtrs: [20, 20, 20],
		tid: i,
	})),
	...rest,
});

const nextSample = (boxScore: any, elapsedSeconds = 10) =>
	getNextLiveWinpSample({
		boxScore,
		elapsedSeconds,
		homeCourtAdvantage: 1,
		quarterLength: QUARTER_LENGTH,
		sportState: undefined,
		xState: { x: 100 },
	});

test("a sample carries the live probability and the advanced x", () => {
	const result = nextSample(sampleBoxScore())!;
	assert.strictEqual(result.sample.x, 110);
	assert.strictEqual(result.xState.x, 110);
	assert.isAbove(result.sample.prob, 0.5);
});

test("the game-over sample resolves to the winner", () => {
	const result = nextSample(sampleBoxScore({ gameOver: true }), 0)!;
	assert.strictEqual(result.sample.prob, 1);
	assert.strictEqual(result.sample.x, 100);
});

test("exhibition games and games without ovrs get no sample", () => {
	assert.isUndefined(nextSample(sampleBoxScore({ exhibition: true })));
	const noOvr = sampleBoxScore();
	for (const t of noOvr.teams) {
		(t as any).ovr = undefined;
	}
	assert.isUndefined(nextSample(noOvr));
});

test("two distinct mid-tone primaries are kept", () => {
	assert.deepEqual(
		getLineColors([
			["#1d428a", "#ffc72c", "#ffffff"],
			["#ce1141", "#000000", "#ffffff"],
		]),
		["#1d428a", "#ce1141"],
	);
});

test("a black primary is replaced by the team's next color", () => {
	assert.deepEqual(
		getLineColors([
			["#000000", "#c8102e", "#ffffff"],
			["#1d428a", "#ffc72c", "#ffffff"],
		]),
		["#c8102e", "#1d428a"],
	);
});

test("near-identical primaries switch the second team to its next color", () => {
	assert.deepEqual(
		getLineColors([
			["#c8102e", "#000000", "#ffffff"],
			["#ce1141", "#1d428a", "#ffffff"],
		]),
		["#c8102e", "#1d428a"],
	);
});

test("teams on the default colors fall back to the neutral pair", () => {
	const defaults = ["#000000", "#cccccc", "#ffffff"];
	assert.deepEqual(getLineColors([defaults, defaults]), [
		...FALLBACK_LINE_COLORS,
	]);
});

test("labels at 50/50 are pushed apart, and labels at 90/10 are left alone", () => {
	const [a, b] = getLabelYs([0.5, 0.5], 0.2);
	assert.closeTo(a - b, 0.2, 1e-9);
	assert.deepEqual(getLabelYs([0.9, 0.1], 0.2), [0.9, 0.1]);
	assert.deepEqual(getLabelYs([0.1, 0.9], 0.2), [0.1, 0.9]);
});

test("labels near 100% stay inside the chart", () => {
	const [a, b] = getLabelYs([1, 0.95], 0.2);
	assert.closeTo(a, 0.9, 1e-9);
	assert.closeTo(b, 0.7, 1e-9);
});
