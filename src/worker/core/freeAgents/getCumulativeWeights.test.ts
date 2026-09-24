import { afterEach, expect, test, vi } from "vitest";
import { choice } from "../../../common/random.ts";
import { getCumulativeWeights } from "./getCumulativeWeights.ts";

// Original stableSoftmax, before the cumulative-weight optimization.
const oldSoftmax = (values: number[], param: number) => {
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
	for (const numerator of numerators) {
		denominator += numerator;
	}
	if (maxValue === 0 || denominator === 0) {
		return numerators.map(() => 1);
	}
	return numerators.map((numerator) => numerator / denominator);
};

afterEach(() => vi.restoreAllMocks());

test.each([1, 2.5, 7.5])(
	"matches old selection, including invalid weights (param %s)",
	(param) => {
		const cases = [
			[7, 3, 10],
			[0, 0],
			[0],
			[Number.NaN],
			[7, Number.NaN, 10],
			[-0.35, -350],
			[Infinity],
			[7, Infinity],
			[-Infinity],
			[Number.MAX_VALUE, 1],
			[Number.MIN_VALUE, 0],
		];
		for (const values of cases) {
			const players = values.map((softmaxValue) => ({ softmaxValue }));
			const weights = getCumulativeWeights(players, param);
			expect(weights.every(Number.isFinite)).toBe(true);
			for (const random of [0, 0.1, 0.5, 0.9, 1 - Number.EPSILON]) {
				vi.spyOn(Math, "random").mockReturnValue(random);
				const expected = choice(players, oldSoftmax(values, param));
				const draw = random * weights.at(-1)!;
				const actual = players[weights.findIndex((weight) => weight >= draw)];
				expect(actual).toBeDefined();
				expect(actual).toBe(expected);
			}
		}
	},
);

test("preserves cumulative rounding for ordinary finite values", () => {
	let seed = 12345;
	const random = () => {
		seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
		return seed / 2 ** 32;
	};
	for (let trial = 0; trial < 1000; trial++) {
		const players = Array.from(
			{ length: 1 + Math.floor(random() * 100) },
			() => ({ softmaxValue: random() * 10000 }),
		);
		const param = [1, 2.5, 7.5][trial % 3]!;
		let total = 0;
		const expected = oldSoftmax(
			players.map((p) => p.softmaxValue),
			param,
		).map((weight) => (total += weight));
		expect(getCumulativeWeights(players, param)).toEqual(expected);
	}
});
