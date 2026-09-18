import { assert, test } from "vitest";
import { POSITION_COUNTS } from "../../../common/constants.ts";
import prepareOvr from "./prepareOvr.football.ts";

type Player = Parameters<typeof prepareOvr>[0][number];

const original = (
	players: Player[],
	weightsByPos: Record<string, number[]>,
	intercept: number,
) => {
	const rows = players.map((p) => ({ pos: p.ratings.pos, value: p.value }));
	rows.sort((a, b) => (b.value ?? Infinity) - (a.value ?? Infinity));
	const valuesByPos: Record<string, number[]> = {};
	for (const { pos, value } of rows) {
		(valuesByPos[pos] ??= []).push(value);
	}
	let predictedMOV = intercept;
	for (const [pos, values] of Object.entries(valuesByPos)) {
		const weights = weightsByPos[pos]!;
		const minLength = weights.length;
		for (let i = 0; i < Math.max(values.length, minLength); i++) {
			let weight = weights[i];
			if (weight === undefined) {
				const base = (3 + minLength) * 0.05;
				const lastWeight = weights.at(-1)!;
				let exponent = i - minLength + 1;
				if (i >= POSITION_COUNTS[pos]!) {
					exponent += 2;
				}
				weight = lastWeight * base ** exponent;
			}
			predictedMOV += weight * (values[i] ?? 0);
		}
	}
	return predictedMOV;
};

test("prepared additions match the original sum across positions, ties, extreme values, and roster sizes", () => {
	const weights = {
		QB: [0.12532827],
		RB: [0.05026595],
		WR: [0.03875859, 0.0255889, 0.0225721],
		OL: [0.0960952, 0.08972395, 0.08625102, 0.08229491, 0.06087159],
		CB: [0.06117803, 0.05999902],
		K: [0.03444709],
	};
	const positions = Object.keys(weights);
	const values = [0, -0, 45, 45, 99, 1e17, -1e17, Number.MIN_VALUE, 0.001];
	for (let size = 0; size < 96; size++) {
		const players = Array.from({ length: size }, (_, i) => ({
			value: values[(i * 7 + size) % values.length]!,
			ratings: { pos: positions[(i * 5 + size) % positions.length]! },
		}));
		const before = structuredClone(players);
		const prepared = prepareOvr(players, weights, -86.54640888008547)!;
		assert(
			Object.is(
				prepared.baseline,
				original(players, weights, -86.54640888008547),
			),
		);
		for (const pos of positions) {
			for (const value of values) {
				const p = { value, ratings: { pos } };
				const expected = original([...players, p], weights, -86.54640888008547);
				assert(
					Object.is(prepared.withPlayer(p), expected),
					`${size}/${pos}/${value}`,
				);
			}
		}
		assert.deepEqual(players, before);
	}
});

test("prepared additions retain cancellation-sensitive group movement and repeated independent candidates", () => {
	const weights = { QB: [1], WR: [-1], RB: [1] };
	const players = [
		{ value: 0, ratings: { pos: "RB" } },
		{ value: 1e17, ratings: { pos: "QB" } },
		{ value: 1e17, ratings: { pos: "WR" } },
	];
	const prepared = prepareOvr(players, weights, 0)!;
	for (const candidate of [
		{ value: 1, ratings: { pos: "RB" } },
		{ value: 1e17, ratings: { pos: "RB" } },
		{ value: 2e17, ratings: { pos: "RB" } },
		{ value: 1, ratings: { pos: "RB" } },
	]) {
		assert(
			Object.is(
				prepared.withPlayer(candidate),
				original([...players, candidate], weights, 0),
			),
		);
	}
	assert.strictEqual(
		prepared.withPlayer({ value: 1, ratings: { pos: "RB" } }),
		1,
	);
});

test("nonfinite and unsupported positions request the original evaluator", () => {
	const weights = { QB: [1] };
	const valid = { value: 50, ratings: { pos: "QB" } };
	const prepared = prepareOvr([valid], weights, 0)!;
	for (const value of [Number.NaN, Infinity, -Infinity, undefined, null]) {
		const invalid = { value, ratings: { pos: "QB" } } as Player;
		assert.strictEqual(prepareOvr([valid, invalid], weights, 0), undefined);
		assert.strictEqual(prepared.withPlayer(invalid), undefined);
	}
	for (const pos of ["unknown", "constructor", "0"]) {
		const invalid = { value: 50, ratings: { pos } };
		assert.strictEqual(prepareOvr([invalid], weights, 0), undefined);
		assert.strictEqual(prepared.withPlayer(invalid), undefined);
	}
});

test("a new preparation observes changed roster values, positions, and coefficients", () => {
	const players = [{ value: 50, ratings: { pos: "QB" } }];
	const weights = { QB: [0.12], WR: [0.03, 0.01, 0.02] };
	const candidate = { value: 45, ratings: { pos: "WR" } };
	const check = () => {
		const prepared = prepareOvr(players, weights, -4.7)!;
		assert(Object.is(prepared.baseline, original(players, weights, -4.7)));
		assert(
			Object.is(
				prepared.withPlayer(candidate),
				original([...players, candidate], weights, -4.7),
			),
		);
	};
	check();
	players[0]!.value = 80;
	check();
	players[0]!.ratings.pos = "WR";
	check();
	weights.WR = [-0, Infinity, Number.NaN];
	check();
	weights.WR = [];
	check();
});
