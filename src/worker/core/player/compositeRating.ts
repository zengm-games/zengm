import { helpers } from "../../util/index.ts";
import fuzzRating from "./fuzzRating.ts";
import type { MinimalPlayerRatings } from "../../../common/types.ts";

const compositeRating = (
	ratings: MinimalPlayerRatings,
	components: (string | number)[],
	weights: number[] | undefined,
	fuzz: boolean,
): number => {
	if (weights === undefined) {
		// Default: array of ones with same size as components
		weights = Array(components.length).fill(1);
	}

	let numerator = 0;
	let denominator = 0;

	for (const [i, component] of components.entries()) {
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
				factor =
					component === "hgt" ? rating : fuzzRating(rating, ratings.fuzz);
			} else {
				factor = rating;
			}
		}

		numerator += factor * weights[i]!;
		denominator += 100 * weights[i]!;
	}

	return helpers.bound(numerator / denominator, 0, 1);
};

export default compositeRating;
