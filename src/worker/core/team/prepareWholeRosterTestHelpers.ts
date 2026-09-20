import { assert, test } from "vitest";
import ovrByPosFactory from "./ovrByPosFactory.ts";
import prepareWholeRoster from "./prepareWholeRoster.ts";

type Player = Parameters<ReturnType<typeof ovrByPosFactory>>[0][number];

const makePlayer = (pos: string, value: number, pid = 0): Player => ({
	pid,
	value,
	ratings: { pos, ovr: 50 },
});

// Football and hockey share fixed player positions, but use different weights
// and roster limits. Exercise each sport's public entry against its ordinary ovr.
const testPreparedWholeRoster = (
	ovr: ReturnType<typeof ovrByPosFactory>,
	positions: string[],
) => {
	test("prepared additions match ordinary ovr across positions, ties, extremes, and roster sizes", () => {
		const values = [0, -0, 45, 45, 99, 1e17, -1e17, Number.MIN_VALUE, 0.001];
		for (let size = 0; size < 96; size++) {
			const players = Array.from({ length: size }, (_, i) =>
				makePlayer(
					positions[(i + size) % positions.length]!,
					values[(i * 7 + size) % values.length]!,
					i,
				),
			);
			const before = structuredClone(players);
			const prepared = prepareWholeRoster(players)!;
			assert(Object.is(prepared.baseline, ovr(players, { wholeRoster: true })));
			for (const pos of positions) {
				for (const value of values) {
					const candidate = makePlayer(pos, value, size);
					assert(
						Object.is(
							prepared.withPlayer(candidate),
							ovr([...players, candidate], { wholeRoster: true }),
						),
						`${size}/${pos}/${value}`,
					);
				}
			}
			assert.deepEqual(players, before);
		}
	});

	test("cancellation-sensitive group movement and stable ties retain every addition", () => {
		const [first, second, third] = positions as [string, string, string];
		const weights = { [first]: [1], [second]: [-1], [third]: [1] };
		const ordinary = ovrByPosFactory(weights, 0, (value) => value);
		const players = [
			makePlayer(third, 0),
			makePlayer(first, 1e17),
			makePlayer(second, 1e17),
		];
		const prepared = ordinary.prepareWholeRoster(players)!;
		for (const value of [1, 1e17, 2e17, 1]) {
			const candidate = makePlayer(third, value);
			assert(
				Object.is(
					prepared.withPlayer(candidate),
					ordinary([...players, candidate], { wholeRoster: true }),
				),
			);
		}
		assert.strictEqual(prepared.withPlayer(makePlayer(third, 1)), 1);
	});

	test("nonfinite values and unsupported positions request the ordinary evaluator", () => {
		const valid = makePlayer(positions[0]!, 50);
		const prepared = prepareWholeRoster([valid])!;
		for (const value of [
			Number.NaN,
			Infinity,
			-Infinity,
			undefined,
			null,
			"50",
		]) {
			const invalid = makePlayer(positions[0]!, value as number);
			assert.strictEqual(prepareWholeRoster([valid, invalid]), undefined);
			assert.strictEqual(prepared.withPlayer(invalid), undefined);
		}
		for (const pos of ["unknown", "constructor", "__proto__", "0"]) {
			const invalid = makePlayer(pos, 50);
			assert.strictEqual(prepareWholeRoster([invalid]), undefined);
			assert.strictEqual(prepared.withPlayer(invalid), undefined);
		}
	});

	test("new batches observe changed values, positions, roster membership, and coefficients", () => {
		const [first, second] = positions as [string, string];
		const players = [makePlayer(first, 50)];
		const weights = { [first]: [0.12], [second]: [0.03, 0.01, 0.02] };
		const ordinary = ovrByPosFactory(weights, -4.7, (value) => value);
		const candidate = makePlayer(second, 45);
		const check = () => {
			const prepared = ordinary.prepareWholeRoster(players)!;
			assert(
				Object.is(prepared.baseline, ordinary(players, { wholeRoster: true })),
			);
			const before = structuredClone(players);
			for (const value of [45, 80, 0, -0, 45]) {
				candidate.value = value;
				assert(
					Object.is(
						prepared.withPlayer(candidate),
						ordinary([...players, candidate], { wholeRoster: true }),
					),
				);
			}
			assert.deepEqual(players, before);
		};
		check();
		players[0]!.value = 80;
		check();
		players[0]!.ratings.pos = second;
		check();
		players.push(makePlayer(first, 80));
		check();
		weights[second] = [-0, Infinity, Number.NaN];
		check();
		weights[second] = [0, undefined, 0.03] as number[];
		check();
		weights[second] = [];
		check();
		players.splice(0, 1);
		check();
	});
};

export default testPreparedWholeRoster;
