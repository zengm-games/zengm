import { assert, test } from "vitest";
import {
	getGamePrediction,
	getWinProbability,
} from "../../common/gamePrediction.ts";
import { getLiveWinp } from "./getLiveWinp.ts";

const getProb = ({
	bases = [undefined, undefined, undefined],
	bottom,
	inning,
	outs,
	pts,
}: {
	bases?: [number | undefined, number | undefined, number | undefined];
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
				// The away team bats first, so it is one ahead during the top of an inning. Inning 0 is before the first pitch.
				ptsQtrs: Array(
					Math.max(0, i === 1 || bottom ? inning : inning - 1),
				).fill(0),
				tid: i,
			})),
			time: "",
		},
		homeCourtAdvantage: 1,
		quarterLength: 12,
		sportState: { bases, o: bottom ? 0 : 1, outs },
	})!.prob;

test("before the first pitch is close to the pre-game value", () => {
	const prob = getProb({ bottom: false, inning: 0, outs: 0, pts: [0, 0] });
	const preGame = getWinProbability(
		getGamePrediction({
			homeCourtAdvantage: 1,
			neutral: false,
			numPeriods: 9,
			ovrs: [55, 55],
			quarterLength: 12,
		}),
	);
	assert.closeTo(prob, preGame, 0.03);
});

test("a deficit hurts more in the bottom of the last inning with two outs", () => {
	const late = getProb({ bottom: true, inning: 9, outs: 2, pts: [2, 3] });
	const early = getProb({ bottom: true, inning: 1, outs: 0, pts: [2, 3] });
	assert.isBelow(late, early);
});

test("uses the runners on base", () => {
	const loaded = getProb({
		bases: [1, 2, 3],
		bottom: true,
		inning: 9,
		outs: 2,
		pts: [2, 3],
	});
	const empty = getProb({ bottom: true, inning: 9, outs: 2, pts: [2, 3] });
	assert.isAbove(loaded, empty);
});

test("tied in extras is near even", () => {
	const prob = getProb({ bottom: true, inning: 11, outs: 1, pts: [4, 4] });
	assert.closeTo(prob, 0.5, 0.1);
});

test("a visitor lead in the 10th is not decided while the home team can still bat", () => {
	for (const bottom of [false, true]) {
		for (const outs of bottom ? [0, 2] : [0, 2, 3]) {
			const prob = getProb({ bottom, inning: 10, outs, pts: [4, 5] });
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
