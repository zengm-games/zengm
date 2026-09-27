import { helpers } from "../../util/index.ts";
import { applyFuzz, getFuzz } from "./fuzzRating.ts";
import type { MinimalPlayerRatings } from "../../../common/types.ts";

const compositeRating = (
	ratings: MinimalPlayerRatings,
	components: (string | number)[],
	weights: number[] | undefined,
	fuzz: boolean,
): number => {
	let numerator = 0;
	let denominator = 0;

	// Only compute this once, rather than for every component
	const fuzzValue = fuzz ? getFuzz(ratings.fuzz) : 0;

	for (let i = 0; i < components.length; i++) {
		const component = components[i]!;
		let factor: number;
		if (typeof component === "number") {
			factor = component;
		} else {
			// @ts-expect-error
			const rating: number | undefined = ratings[component];

			if (rating === undefined) {
				throw new Error(`Undefined value for rating "${component}"`);
			}

			if (fuzz) {
				// Don't fuzz height
				factor = component === "hgt" ? rating : applyFuzz(rating, fuzzValue);
			} else {
				factor = rating;
			}
		}

		const weight = weights?.[i] ?? 1;
		numerator += factor * weight;
		denominator += 100 * weight;
	}

	return helpers.bound(numerator / denominator, 0, 1);
};

export default compositeRating;
