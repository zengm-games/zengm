import { helpers } from "../../util";
import fuzzRating from "./fuzzRating";
import { MinimalPlayerRatings } from "../../../common/types";

const composoteRating = (
	ratings: MinimalPlayerRatings,
	components: (string | number)[],
	weights: number[] | undefined | null,
	fuzz: boolean,
): number => {
	if (weights === undefined) {
		// Default: array of ones with same size as components
		weights = Array(components.length).fill(1);
	}

	let numerator = 0;
	let denominator = 0;

	for (let i = 0; i < components.length; i++) {
		const component = components[i];

		let factor: number;
		if (typeof component === "number") {
			factor = component;
		} else if (fuzz) {
			// Don't fuzz height
			factor =
				component === "hgt"
					? ratings[component]
					: fuzzRating(ratings[component], ratings.fuzz);
		} else {
			factor = ratings[component];
		}

		numerator += factor * weights[i];
		denominator += 100 * weights[i];
	}

	return helpers.bound(numerator / denominator, 0, 1);
};

export default composoteRating;
