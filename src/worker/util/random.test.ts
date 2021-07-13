import assert from "assert";
import random from "./random";
import { helpers } from "../../common";

describe("worker/util/random", () => {
	describe("choice", () => {
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
				const choice = random.choice(x);
				counts[choice] += 1;
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
				const choice = random.choice(x, weightFunc);
				counts[choice] += 1;
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
				const choice = random.choice(helpers.keys(values), key => values[key]);
				assert(helpers.keys(values).includes(choice));
			}
		});
	});
});
