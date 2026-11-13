import { assert, describe, test } from "vitest";
import {
	formatTitleOdds,
	getWinModelInputs,
	getWinProbability,
	roundWinPercents,
} from "./winProbability.ts";

const hockey = { homeEdge: 0.25, perOvr: 0.018, sigma: 2.3 };

const inputs = (ovrs: [number, number], neutral = true) =>
	getWinModelInputs({
		homeCourtAdvantage: 1,
		neutral,
		numPeriods: 4,
		ovrs,
		quarterLength: 12,
	});

describe("getWinProbability", () => {
	test("equal teams at a neutral site are even", () => {
		assert.closeTo(getWinProbability(inputs([50, 50])), 0.5, 1e-6);
	});

	test("rises with the rating gap", () => {
		let prev = 0;
		for (const gap of [-20, -10, 0, 5, 10, 20]) {
			const prob = getWinProbability(inputs([50 + gap, 50]));
			assert.isAbove(prob, prev);
			prev = prob;
		}
	});

	test("home edge helps the home team", () => {
		assert.isAbove(getWinProbability(inputs([50, 50], false)), 0.5);
	});

	test("live at the start equals pre-game", () => {
		const input = inputs([60, 50], false);
		assert.strictEqual(
			getWinProbability({ ...input, frac: 1, margin: 0 }),
			getWinProbability(input),
		);
	});

	test("the same lead is worth more with less time left", () => {
		const input = inputs([50, 50]);
		assert.isAbove(
			getWinProbability({ ...input, frac: 0.1, margin: 5 }),
			getWinProbability({ ...input, frac: 0.5, margin: 5 }),
		);
	});

	test("no time left and tied is even, not NaN", () => {
		assert.strictEqual(
			getWinProbability({ ...inputs([60, 50]), frac: 0, margin: 0 }),
			0.5,
		);
	});

	test("no time left with a lead is decided by the lead", () => {
		const input = inputs([50, 60]);
		assert.strictEqual(getWinProbability({ ...input, frac: 0, margin: 1 }), 1);
		assert.strictEqual(getWinProbability({ ...input, frac: 0, margin: -1 }), 0);
	});

	test("the better team is favored more in a longer game", () => {
		const prob = (quarterLength: number) =>
			getWinProbability(
				getWinModelInputs({
					homeCourtAdvantage: 1,
					neutral: true,
					numPeriods: 4,
					ovrs: [60, 50],
					quarterLength,
				}),
			);
		assert.isAbove(prob(24), prob(12));
	});

	test("quarterLength of 0 is even", () => {
		assert.strictEqual(
			getWinProbability(
				getWinModelInputs({
					homeCourtAdvantage: 1,
					neutral: false,
					numPeriods: 4,
					ovrs: [70, 50],
					quarterLength: 0,
				}),
			),
			0.5,
		);
	});

	test("hockey constants are finite and monotonic", () => {
		let prev = 0;
		for (const gap of [-20, 0, 20]) {
			const prob = getWinProbability(
				getWinModelInputs({
					constants: hockey,
					homeCourtAdvantage: 1,
					neutral: false,
					numPeriods: 3,
					ovrs: [50 + gap, 50],
					quarterLength: 20,
				}),
			);
			assert.isTrue(Number.isFinite(prob));
			assert.isAbove(prob, prev);
			prev = prob;
		}
	});
});

describe("roundWinPercents", () => {
	test("0.496 rounds to an even 50/50", () => {
		assert.deepEqual(roundWinPercents(0.496), {
			even: true,
			percents: [50, 50],
		});
	});

	test("clamps to 1..99 unless resolved", () => {
		assert.deepEqual(roundWinPercents(0.999).percents, [99, 1]);
		assert.deepEqual(roundWinPercents(0.001).percents, [1, 99]);
		assert.deepEqual(roundWinPercents(1, true).percents, [100, 0]);
		assert.deepEqual(roundWinPercents(0, true).percents, [0, 100]);
	});

	test("the sides always sum to 100", () => {
		for (let i = 0; i <= 1000; i++) {
			const { percents } = roundWinPercents(i / 1000);
			assert.strictEqual(percents[0] + percents[1], 100);
		}
	});

	test("rounds the same for either side", () => {
		for (let i = 0; i <= 1000; i++) {
			const { percents } = roundWinPercents(i / 1000);
			const flipped = roundWinPercents(1 - i / 1000).percents;
			assert.deepEqual(percents, [flipped[1], flipped[0]]);
		}
	});
});

describe("formatTitleOdds", () => {
	test("never shows 0% or 100% from rounding", () => {
		assert.strictEqual(formatTitleOdds(0), "<1%");
		assert.strictEqual(formatTitleOdds(0.004), "<1%");
		assert.strictEqual(formatTitleOdds(0.996), ">99%");
		assert.strictEqual(formatTitleOdds(0.995), ">99%");
		assert.strictEqual(formatTitleOdds(1), ">99%");
	});

	test("shows whole percentages", () => {
		assert.strictEqual(formatTitleOdds(0.005), "1%");
		assert.strictEqual(formatTitleOdds(0.234), "23%");
	});

	test("shows 0% and 100% from game state", () => {
		assert.strictEqual(formatTitleOdds(0, true), "0%");
		assert.strictEqual(formatTitleOdds(1, true), "100%");
	});
});
