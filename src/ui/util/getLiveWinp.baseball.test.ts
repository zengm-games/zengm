import { assert, test } from "vitest";
import { getLiveWinp } from "./getLiveWinp.ts";

const getProb = ({
	bottom,
	inning,
	outs,
	pts,
}: {
	bottom: boolean;
	inning: number;
	outs: number;
	pts: [number, number];
}) =>
	getLiveWinp({
		boxScore: {
			numPeriods: 9,
			teams: [0, 1].map((i) => ({
				ovr: 55,
				pts: pts[i],
				// The away team bats first, so it is one ahead during the top of an inning
				ptsQtrs: Array(i === 1 || bottom ? inning : inning - 1).fill(0),
				tid: i,
			})),
			time: "",
		},
		homeCourtAdvantage: 1,
		quarterLength: 12,
		sportState: { outs },
	})!.prob;

test("a deficit hurts more in the bottom of the last inning with two outs", () => {
	const late = getProb({ bottom: true, inning: 9, outs: 2, pts: [2, 3] });
	const early = getProb({ bottom: true, inning: 1, outs: 0, pts: [2, 3] });
	assert.isBelow(late, early);
});

test("tied in extras is near even", () => {
	const prob = getProb({ bottom: true, inning: 11, outs: 1, pts: [4, 4] });
	assert.closeTo(prob, 0.5, 0.1);
});

test("a visitor lead in the 10th is finite and not decided", () => {
	for (const bottom of [false, true]) {
		for (const outs of [0, 2, 3]) {
			const prob = getProb({ bottom, inning: 10, outs, pts: [4, 5] });
			assert.isTrue(Number.isFinite(prob));
			assert.isAbove(prob, 0.01);
			assert.isBelow(prob, 0.5);
		}
	}
});

test("a later extra inning is no more decided than the 10th", () => {
	assert.closeTo(
		getProb({ bottom: true, inning: 10, outs: 1, pts: [4, 5] }),
		getProb({ bottom: true, inning: 14, outs: 1, pts: [4, 5] }),
		1e-9,
	);
});
