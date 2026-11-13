import { assert, test } from "vitest";
import {
	advanceLiveWinpX,
	getLiveWinpXDomain,
	INITIAL_LIVE_WINP_X_STATE,
} from "./liveWinpChart.ts";

const boxScore = {
	numPeriods: 4,
	teams: [
		{ pts: 7, ptsQtrs: [7] },
		{ pts: 0, ptsQtrs: [0] },
	],
	time: "10:00",
};

const advance = (state: typeof INITIAL_LIVE_WINP_X_STATE, elapsed: number) =>
	advanceLiveWinpX({
		boxScore,
		elapsedSeconds: elapsed,
		quarterLength: 15,
		sportState: {},
		state,
	});

test("plays with no clock time keep x the same", () => {
	let state = advance(INITIAL_LIVE_WINP_X_STATE, 40);
	for (let i = 0; i < 3; i++) {
		state = advance(state, 0);
	}
	assert.strictEqual(state.x, 40);
});

test("the domain is four 15 minute quarters", () => {
	assert.strictEqual(
		getLiveWinpXDomain({ boxScore, quarterLength: 15, x: 40 }),
		3600,
	);
});
