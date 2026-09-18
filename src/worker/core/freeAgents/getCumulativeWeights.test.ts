import { expect, test } from "vitest";
import getCumulativeWeights from "./getCumulativeWeights.ts";

// Reference: the former stableSoftmax followed by random.choice's cumulative sum.
const reference = (values: number[], param: number) => {
	let maxValue = -Infinity;
	for (const value of values) {
		if (value > maxValue) {
			maxValue = value;
		}
	}
	const numerators = values.map((value) =>
		Math.exp((param * value) / maxValue),
	);
	let denominator = 0;
	for (const value of numerators) {
		denominator += value;
	}
	const weights = numerators.map((value) =>
		maxValue === 0 || denominator === 0 ? 1 : value / denominator,
	);
	return weights.reduce<number[]>((sums, input, i) => {
		const weight = input < 0 || Number.isNaN(input) ? Number.MIN_VALUE : input;
		sums[i] = i === 0 ? weight : sums[i - 1]! + weight;
		return sums;
	}, []);
};

test.each(
	[
		[],
		[0, 0, 0],
		[3, 12, 50, 99],
		[-50, -2, 0, 10],
		[-50, -2],
		[Number.MIN_VALUE, Number.MIN_VALUE * 2],
		[1e250, 1e300],
		[Number.NaN, 1, Infinity],
	].map((values) => ({ values })),
)("preserves cumulative choice thresholds for $values", ({ values }) => {
	for (const param of [0, 1, 2.5, 7.5, -10000]) {
		const players = values.map((softmaxValue) => ({ softmaxValue }));
		expect(getCumulativeWeights(players, param, [])).toEqual(
			reference(values, param),
		);
	}
});

test("reuses scratch weights without retaining players removed between bids", () => {
	const scratch = [999, 999, 999, 999];
	const players = [7, 3, 10].map((softmaxValue) => ({ softmaxValue }));
	for (let length = players.length; length >= 0; length--) {
		players.length = length;
		expect(getCumulativeWeights(players, 2.5, scratch)).toBe(scratch);
		expect(scratch).toEqual(
			reference(
				players.map((p) => p.softmaxValue),
				2.5,
			),
		);
	}
});
