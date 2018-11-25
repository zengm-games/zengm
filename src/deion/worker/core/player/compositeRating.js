// @flow

import { helpers } from "../../util";
import fuzzRating from "./fuzzRating";
import type { MinimalPlayerRatings } from "../../../common/types";

const composoteRating = (
    ratings: MinimalPlayerRatings,
    components: (string | number)[],
    weights?: number[],
    fuzz: boolean,
): number => {
    if (weights === undefined) {
        // Default: array of ones with same size as components
        weights = Array(components.length).fill(1);
    }

    let numerator = 0;
    let denominator = 0;
    for (let i = 0; i < components.length; i++) {
        let factor: number;
        if (typeof components[i] === "number") {
            factor = components[i];
        } else if (fuzz) {
            // Don't fuzz height
            factor =
                components[i] === "hgt"
                    ? ratings[components[i]]
                    : fuzzRating(ratings[components[i]], ratings.fuzz); // don't fuzz height
        } else {
            factor = ratings[components[i]];
        }

        numerator += factor * weights[i];
        denominator += 100 * weights[i];
    }

    return helpers.bound(numerator / denominator, 0, 1);
};

export default composoteRating;
