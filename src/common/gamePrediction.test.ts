import { assert, describe, test } from "vitest";
import {
	formatGameSpreads,
	formatOdds,
	getGamePrediction,
	getWinProbability,
	makeGetPregameWinProbability,
	roundWinPercents,
} from "./gamePrediction.ts";

const base = {
	homeCourtAdvantage: 1,
	neutral: true,
	numPeriods: 4,
	ovrs: [50, 50],
	quarterLength: 12,
} as const;

const predict = (args: Partial<Parameters<typeof getGamePrediction>[0]> = {}) =>
	getGamePrediction({ ...base, ...args });

// Simple numbers to test the formulas with, independent of the real ones
const constants = {
	perOvr: 0.5,
	homeCourtOvr: 4,
	sigma: 10,
	liveLeadDecay: 0,
	liveSigmaExponent: 0.5,
};

describe("getGamePrediction", () => {
	test("spread is perOvr times the ovr gap plus home court in ovr points", () => {
		const { spread, sigma } = predict({
			constants,
			neutral: false,
			ovrs: [60, 50],
		});
		assert.closeTo(spread, 0.5 * (10 + 4), 1e-9);
		assert.strictEqual(sigma, 10);
	});

	test("no home court at a neutral site", () => {
		assert.closeTo(predict({ constants, ovrs: [60, 50] }).spread, 5, 1e-9);
		assert.strictEqual(predict({ constants }).spread, 0);
	});

	test("home court scales with the setting", () => {
		const spread = (homeCourtAdvantage: number) =>
			predict({ constants, homeCourtAdvantage, neutral: false }).spread;
		assert.closeTo(spread(3), 3 * spread(1), 1e-9);
		assert.strictEqual(spread(0), 0);
	});

	test("spread scales with game length and sigma with its square root, however it's split into periods", () => {
		const half = predict({ constants, ovrs: [60, 50], quarterLength: 6 });
		assert.closeTo(half.spread, 2.5, 1e-9);
		assert.closeTo(half.sigma, 10 * Math.sqrt(0.5), 1e-9);
		assert.deepEqual(
			predict({ constants, ovrs: [60, 50], numPeriods: 2 }),
			half,
		);
	});

	test("the better team is favored more in a longer game", () => {
		const prob = (quarterLength: number) =>
			getWinProbability(predict({ ovrs: [60, 50], quarterLength }));
		assert.isAbove(prob(24), prob(12));
	});
});

describe("getWinProbability", () => {
	test("equal teams at a neutral site are even", () => {
		assert.closeTo(getWinProbability(predict()), 0.5, 1e-6);
	});

	test("rises with the rating gap", () => {
		let prev = 0;
		for (const gap of [-20, -10, 0, 5, 10, 20]) {
			const prob = getWinProbability(predict({ ovrs: [50 + gap, 50] }));
			assert.isAbove(prob, prev);
			prev = prob;
		}
	});

	test("home court helps the home team", () => {
		assert.isAbove(getWinProbability(predict({ neutral: false })), 0.5);
	});

	test("agrees with the spread on who is favored", () => {
		for (const gap of [-3, -0.5, 0.5, 3]) {
			const prediction = predict({ ovrs: [50 + gap, 50] });
			assert.strictEqual(
				getWinProbability(prediction) > 0.5,
				prediction.spread > 0,
			);
		}
	});

	test("live at the start equals pre-game", () => {
		const prediction = predict({ neutral: false, ovrs: [60, 50] });
		assert.strictEqual(
			getWinProbability({ ...prediction, frac: 1, margin: 0 }),
			getWinProbability(prediction),
		);
	});

	test("the same lead is worth more with less time left", () => {
		assert.isAbove(
			getWinProbability({ ...predict(), frac: 0.1, margin: 5 }),
			getWinProbability({ ...predict(), frac: 0.5, margin: 5 }),
		);
	});

	test("with no lead decay, a lead is kept on average", () => {
		// margin 5 with spread 0 and half the game left: P(N(5, 10 * sqrt(0.5)) > 0)
		assert.closeTo(
			getWinProbability({
				constants,
				frac: 0.5,
				margin: 5,
				sigma: 10,
				spread: 0,
			}),
			0.7602,
			1e-3,
		);
	});

	test("lead decay makes a lead with time left worth less, but not at the end", () => {
		const decay = { ...constants, liveLeadDecay: 0.5 };
		const prob = (c: typeof constants, frac: number) =>
			getWinProbability({
				constants: c,
				frac,
				margin: 5,
				sigma: 10,
				spread: 0,
			});
		assert.isBelow(prob(decay, 0.5), prob(constants, 0.5));
		assert.strictEqual(prob(decay, 0), prob(constants, 0));
	});

	test("no time left and tied is even, not NaN", () => {
		assert.strictEqual(
			getWinProbability({ ...predict({ ovrs: [60, 50] }), frac: 0, margin: 0 }),
			0.5,
		);
	});

	test("no time left with a lead is decided by the lead", () => {
		const prediction = predict({ ovrs: [50, 60] });
		assert.strictEqual(
			getWinProbability({ ...prediction, frac: 0, margin: 1 }),
			1,
		);
		assert.strictEqual(
			getWinProbability({ ...prediction, frac: 0, margin: -1 }),
			0,
		);
	});

	test("quarterLength of 0 is even", () => {
		assert.strictEqual(
			getWinProbability(
				predict({ neutral: false, ovrs: [70, 50], quarterLength: 0 }),
			),
			0.5,
		);
	});
});

test("makeGetPregameWinProbability matches getWinProbability", () => {
	for (const quarterLength of [12, 0]) {
		for (const neutral of [false, true]) {
			const settings = {
				constants,
				homeCourtAdvantage: 1.5,
				numPeriods: 4,
				quarterLength,
			};
			const getProb = makeGetPregameWinProbability(settings);
			for (const ovrs of [
				[60, 50],
				[50, 50],
				[45, 55],
			] as const) {
				assert.strictEqual(
					getProb(ovrs[0], ovrs[1], neutral),
					getWinProbability({
						...getGamePrediction({ ...settings, neutral, ovrs }),
						constants,
					}),
				);
			}
		}
	}
});

describe("formatGameSpreads", () => {
	test("formats the spread the way ScoreBox always has", () => {
		assert.deepEqual(formatGameSpreads(6.3504), ["-6.5", undefined]);
		assert.deepEqual(formatGameSpreads(-3.1), [undefined, "-3"]);
		assert.deepEqual(formatGameSpreads(0.2), [undefined, "PK"]);
		assert.deepEqual(formatGameSpreads(12.25), ["-12.5", undefined]);
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

describe("formatOdds", () => {
	test("never shows 0% or 100% from rounding", () => {
		assert.strictEqual(formatOdds(0), "<1%");
		assert.strictEqual(formatOdds(0.004), "<1%");
		assert.strictEqual(formatOdds(0.996), ">99%");
		assert.strictEqual(formatOdds(0.995), ">99%");
		assert.strictEqual(formatOdds(1), ">99%");
	});

	test("shows whole percentages", () => {
		assert.strictEqual(formatOdds(0.005), "1%");
		assert.strictEqual(formatOdds(0.234), "23%");
	});

	test("shows 0% and 100% from game state", () => {
		assert.strictEqual(formatOdds(0, true), "0%");
		assert.strictEqual(formatOdds(1, true), "100%");
	});
});
