import { assert, test } from "vitest";
import compositeRating from "./compositeRating.ts";
import fuzzRating from "./fuzzRating.ts";
import { helpers } from "../../util/index.ts";
import type { MinimalPlayerRatings } from "../../../common/types.ts";

test("matches the original rating formula with default and explicit weights", () => {
	for (let i = 0; i < 100; i++) {
		const ratings = {
			hgt: i,
			spd: 100 - i,
			fuzz: i / 7 - 5,
		} as unknown as MinimalPlayerRatings;
		for (const components of [["hgt", "spd", 50], ["spd"], []]) {
			for (const weights of [undefined, [1, 2, 3], [0, 0, 0], [-1, 0.5, 3]]) {
				for (const fuzz of [false, true]) {
					const originalWeights = weights ?? Array(components.length).fill(1);
					let numerator = 0;
					let denominator = 0;
					for (const [index, component] of components.entries()) {
						const value =
							typeof component === "number"
								? component
								: (ratings as unknown as Record<string, number>)[component]!;
						const factor =
							fuzz && typeof component === "string" && component !== "hgt"
								? fuzzRating(value, ratings.fuzz)
								: value;
						numerator += factor * originalWeights[index]!;
						denominator += 100 * originalWeights[index]!;
					}
					assert.deepEqual(
						compositeRating(ratings, components, weights, fuzz),
						helpers.bound(numerator / denominator, 0, 1),
					);
				}
			}
		}
	}
});

test("retains the error for missing ratings", () => {
	assert.throws(
		() =>
			compositeRating({} as MinimalPlayerRatings, ["spd"], undefined, false),
		'Undefined value for rating "spd"',
	);
});
