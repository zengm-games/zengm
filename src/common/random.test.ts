import { assert, describe, test, vi } from "vitest";
import { choice, uniformSeed } from "./random.ts";
import { helpers } from "./helpers.ts";

describe("choice", () => {
	test("matches the previous weighted calculation, including sparse and invalid weights", () => {
		const pools = [
			[1, 2, 3],
			[0, 0, 0],
			[-1, Number.NaN, 2],
			[Number.MIN_VALUE, 1e-200, 1e200],
			[Infinity, 1],
			[],
			Object.assign(Array<number>(3), { 0: 1, 2: 2 }),
			Object.assign(Array<number>(3), { 1: 1, 2: 2 }),
		];
		for (const weights of pools) {
			const original = [...weights];
			const items = ["a", "b", "c"];
			const cumsums = weights
				.map((w) => (w < 0 || Number.isNaN(w) ? Number.MIN_VALUE : w))
				.reduce<number[]>((sums, w, i) => {
					sums[i] = i === 0 ? w : sums[i - 1]! + w;
					return sums;
				}, []);
			for (let seed = 0; seed < 1000; seed++) {
				const draw = uniformSeed(seed + 1) * cumsums.at(-1)!;
				assert.strictEqual(
					choice(items, weights, seed),
					items[cumsums.findIndex((sum) => sum >= draw)],
				);
			}
			assert.deepEqual([...weights], original);
		}
	});

	test("preserves exact selection boundaries and calls weight callbacks before drawing", () => {
		const events: string[] = [];
		const random = vi.spyOn(Math, "random").mockImplementation(() => {
			events.push("draw");
			return 0.5;
		});
		try {
			assert.strictEqual(
				choice(["a", "b", "c"], (_, index) => {
					events.push(String(index));
					return [1, 1, 2][index]!;
				}),
				"b",
			);
			assert.deepEqual(events, ["0", "1", "2", "draw"]);
			assert.strictEqual(random.mock.calls.length, 1);
		} finally {
			random.mockRestore();
		}
	});
	test("works", () => {
		const counts = {
			a: 0,
			b: 0,
			c: 0,
			d: 0,
			e: 0,
		};
		const x = helpers.keys(counts);
		const N = 10000;

		for (let i = 0; i < N; i++) {
			const selected = choice(x);
			counts[selected] += 1;
		}

		for (const letter of x) {
			assert(counts[letter] > 0.1 * N);
			assert(counts[letter] < 0.3 * N);
		}
	});

	test("works with weight function", () => {
		const counts = {
			a: 0,
			b: 0,
			c: 0,
			d: 0,
			e: 0,
		};
		const x = helpers.keys(counts);
		const N = 100000;

		const weightFunc = (letter: keyof typeof counts) =>
			letter === "e" ? 10 : 1;

		for (let i = 0; i < N; i++) {
			const selected = choice(x, weightFunc);
			counts[selected] += 1;
		}

		for (const letter of x) {
			if (letter === "e") {
				// Should be 10/14 * N
				assert(counts[letter] > (9.5 / 14) * N);
				assert(counts[letter] < (10.5 / 14) * N);
			} else {
				// Should be 1/14 * N
				assert(counts[letter] > (0.8 / 14) * N);
				assert(counts[letter] < (1.2 / 14) * N);
			}
		}
	});

	test("works with weight function that returns negative value", () => {
		const values = {
			a: -10,
			b: -20,
			c: 1,
		};

		for (let i = 0; i < 10; i++) {
			const selected = choice(helpers.keys(values), (key) => values[key]);
			assert(helpers.keys(values).includes(selected));
		}
	});
});
