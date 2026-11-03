import { assert, test } from "vitest";
import {
	advanceLiveWinpX,
	getLiveWinpXDomain,
	INITIAL_LIVE_WINP_X_STATE,
} from "./liveWinpChart.ts";

// teams[0] is home and bats in the bottom, so the away team is one inning ahead during the top of an inning
const makeBoxScore = ({
	bottom,
	inning,
}: {
	bottom: boolean;
	inning: number;
}) => ({
	numPeriods: 9,
	teams: [0, 1].map((i) => ({
		pts: 0,
		ptsQtrs: Array(i === 1 || bottom ? inning : inning - 1).fill(0),
	})),
	time: "",
});

const getX = ({
	bottom,
	inning,
	outs,
	state = INITIAL_LIVE_WINP_X_STATE,
}: {
	bottom: boolean;
	inning: number;
	outs: number;
	state?: typeof INITIAL_LIVE_WINP_X_STATE;
}) =>
	advanceLiveWinpX({
		boxScore: makeBoxScore({ bottom, inning }),
		elapsedSeconds: 0,
		quarterLength: 12,
		sportState: { outs },
		state,
	}).x;

test("x counts outs elapsed", () => {
	assert.strictEqual(getX({ bottom: false, inning: 1, outs: 2 }), 2);
	assert.strictEqual(getX({ bottom: true, inning: 5, outs: 1 }), 28);
});

test("extra innings extend x and the domain past 54 outs", () => {
	const x = getX({ bottom: false, inning: 10, outs: 0 });
	assert.strictEqual(x, 54);
	const x2 = getX({ bottom: false, inning: 10, outs: 2 });
	assert.strictEqual(x2, 56);
	assert.strictEqual(
		getLiveWinpXDomain({
			boxScore: makeBoxScore({ bottom: false, inning: 10 }),
			quarterLength: 12,
			x: x2,
		}),
		56,
	);
});

test("a walk-off or a skipped bottom 9th ends the line early, and the domain stays at 54", () => {
	assert.strictEqual(getX({ bottom: true, inning: 9, outs: 1 }), 52);
	const skipped = getX({ bottom: false, inning: 9, outs: 3 });
	assert.strictEqual(skipped, 51);
	assert.strictEqual(
		getLiveWinpXDomain({
			boxScore: makeBoxScore({ bottom: false, inning: 9 }),
			quarterLength: 12,
			x: skipped,
		}),
		54,
	);
});

test("never moves backwards", () => {
	const x = getX({
		bottom: false,
		inning: 3,
		outs: 0,
		state: { x: 20 },
	});
	assert.strictEqual(x, 20);
});
