import { assert, test } from "vitest";
import { getWinProbabilityBaseball } from "./winProbability.ts";

const base = {
	basesOccupied: [false, false, false],
	inning: 1,
	margin: 0,
	numInnings: 9,
	o: 1,
	outs: 0,
	spread: 0,
} as const;

const getProb = (
	args: Partial<Parameters<typeof getWinProbabilityBaseball>[0]>,
) => getWinProbabilityBaseball({ ...base, ...args });

test("equal teams are even before the first pitch", () => {
	assert.closeTo(getProb({}), 0.5, 1e-9);
});

test("rises with the spread", () => {
	let prev = 0;
	for (const spread of [-2, -1, 0, 1, 2]) {
		const prob = getProb({ spread });
		assert.isAbove(prob, prev);
		prev = prob;
	}
});

test("a one run lead is safer with less of the game left", () => {
	const lead = (inning: number) =>
		getProb({ inning, margin: 1, o: 1, outs: 3 });
	assert.isAbove(lead(8), lead(5));
	assert.isAbove(lead(5), lead(2));
});

test("runners on base help the team batting", () => {
	const prob = (basesOccupied: [boolean, boolean, boolean]) =>
		getProb({ basesOccupied, inning: 9, o: 0 });
	assert.isAbove(prob([true, true, true]), prob([false, false, false]));
	assert.isAbove(prob([false, false, true]), prob([true, false, false]));
});

test("more outs hurt the team batting", () => {
	const prob = (outs: number) => getProb({ inning: 9, o: 0, outs });
	assert.isAbove(prob(0), prob(1));
	assert.isAbove(prob(1), prob(2));
});

test("after the last out, the result is decided unless tied", () => {
	assert.strictEqual(getProb({ inning: 9, margin: -1, o: 0, outs: 3 }), 0);
	assert.closeTo(getProb({ inning: 9, margin: 0, o: 0, outs: 3 }), 0.5, 1e-9);
	assert.strictEqual(getProb({ inning: 12, margin: 2, o: 0, outs: 3 }), 1);
});

test("the home team is not finished after the top of the last inning", () => {
	const prob = getProb({ inning: 9, margin: -1, o: 1, outs: 3 });
	assert.isAbove(prob, 0.05);
	assert.isBelow(prob, 0.3);
});

test("probabilities stay between 0 and 1", () => {
	for (const margin of [-10, -1, 0, 1, 10]) {
		for (const spread of [-5, 0, 5]) {
			const prob = getProb({ inning: 5, margin, o: 0, outs: 1, spread });
			assert.isAtLeast(prob, 0);
			assert.isAtMost(prob, 1);
		}
	}
});
