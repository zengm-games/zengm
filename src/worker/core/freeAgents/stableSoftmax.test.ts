import { assert, test } from "vitest";
import stableSoftmax, { type SoftmaxCache } from "./stableSoftmax.ts";

test("cumulative mode matches normalized weighted-choice arithmetic", () => {
	for (const input of [
		[2, 0, 1],
		[0, 0],
		[-1, 0],
		[-40, -41],
		[Infinity, 1],
		[Number.NaN, 1],
		[],
	]) {
		for (const param of [7.5, 2.5, 0, -1e9]) {
			const weights = stableSoftmax([...input], param);
			const expected = weights
				.map((weight) =>
					weight < 0 || Number.isNaN(weight) ? Number.MIN_VALUE : weight,
				)
				.reduce<number[]>((sums, weight, i) => {
					sums[i] = i === 0 ? weight : sums[i - 1]! + weight;
					return sums;
				}, []);
			const values = [...input];
			const cache = input.map(() => ({}));
			assert.strictEqual(stableSoftmax(values, param, cache, true), values);
			assert.deepEqual(values, expected);
			assert.deepEqual(stableSoftmax([...input], param, cache, true), expected);
		}
	}
});

test("normalizes weights while preserving the input order", () => {
	const weights = stableSoftmax([2, 0, 1], 1);
	const total = Math.exp(1) + 1 + Math.exp(0.5);
	assert.deepEqual(weights, [
		Math.exp(1) / total,
		1 / total,
		Math.exp(0.5) / total,
	]);
	assert.closeTo(
		weights.reduce((sum, weight) => sum + weight, 0),
		1,
		1e-15,
	);
});

test("zero maximum and underflow retain equal fallback weights", () => {
	assert.deepEqual(stableSoftmax([0, 0, 0], 2.5), [1, 1, 1]);
	assert.deepEqual(stableSoftmax([-1, 0], 2.5), [1, 1]);
	assert.deepEqual(stableSoftmax([1, 2], -1e9), [1, 1]);
});

test("handles empty and single-player pools", () => {
	assert.deepEqual(stableSoftmax([], 2.5), []);
	assert.deepEqual(stableSoftmax([10], 2.5), [1]);
});

test("large values produce finite normalized weights", () => {
	const weights = stableSoftmax([1e200, 2e200], 7.5);
	assert.isTrue(weights.every(Number.isFinite));
	assert.isAbove(weights[1]!, weights[0]!);
	assert.closeTo(weights[0]! + weights[1]!, 1, 1e-15);
});

test("cached weights match uncached math after pool and parameter changes", () => {
	const players: { value: number; softmaxCache?: SoftmaxCache }[] = [
		{ value: 4 },
		{ value: 2 },
		{ value: 0 },
		{ value: -1 },
	];
	for (const param of [7.5, 2.5, 0, -1e9, 7.5]) {
		for (const indexes of [
			[0, 1, 2, 3],
			[0, 2, 3],
			[3, 1],
			[2, 3],
			[2],
			[],
			[0, 1, 2, 3],
		]) {
			const pool = indexes.map((i) => players[i]!);
			const values = pool.map((p) => p.value);
			assert.deepEqual(
				stableSoftmax([...values], param, pool),
				stableSoftmax([...values], param),
			);
			assert.deepEqual(
				stableSoftmax([...values], param, pool),
				stableSoftmax([...values], param),
			);
		}
		players[0]!.value += 1;
	}
});

test("invalidates a cached player value while the pool maximum stays unchanged", () => {
	const cache: { softmaxCache?: SoftmaxCache }[] = [{}, {}];
	stableSoftmax([10, 2], 7.5, cache);
	assert.deepEqual(
		stableSoftmax([10, 3], 7.5, cache),
		stableSoftmax([10, 3], 7.5),
	);
	assert.deepEqual(
		stableSoftmax([Infinity, Number.NaN], 7.5, cache),
		stableSoftmax([Infinity, Number.NaN], 7.5),
	);
});
