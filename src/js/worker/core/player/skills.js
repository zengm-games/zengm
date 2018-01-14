// @flow

import { COMPOSITE_WEIGHTS } from "../../../common";
import { player } from "../../core";
import { random } from "../../util";
import type {
    PlayerRatings,
    PlayerSkill,
    RatingKey,
} from "../../../common/types";

const hasSkill = (
    ratings: PlayerRatings,
    components: RatingKey[],
    weights: number[],
    cutoff?: number = 0.57,
): boolean => {
    if (weights === undefined) {
        // Default: array of ones with same size as components
        weights = [];
        for (let i = 0; i < components.length; i++) {
            weights.push(1);
        }
    }

    let numerator = 0;
    let denominator = 0;
    for (let i = 0; i < components.length; i++) {
        let factor: number;
        if (typeof components[i] === "number") {
            factor = components[i];
        } else {
            // Don't fuzz height
            factor =
                components[i] === "hgt"
                    ? ratings[components[i]]
                    : player.fuzzRating(ratings[components[i]], ratings.fuzz); // don't fuzz height
        }

        numerator += factor * weights[i];
        denominator += 100 * weights[i];
    }

    return numerator / denominator > cutoff;
};

/**
 * Assign "skills" based on ratings.
 *
 * "Skills" are discrete categories, like someone is a 3 point shooter or they aren't. These are displayed next to the player's name generally, and are also used in game simulation. The possible skills are:
 *
 * * Three Point Shooter (3)
 * * Athlete (A)
 * * Ball Handler (B)
 * * Interior Defender (Di)
 * * Perimeter Defender (Dp)
 * * Post Scorer (Po)
 * * Passer (Ps)
 * * Rebounder (R)
 *
 * There should be about 30 (number of teams) players with each skill, except 3 point shooting which should have 60.
 */
const skills = (ratings: PlayerRatings): PlayerSkill[] => {
    const sk = [];

    // These use the same formulas as the composite rating definitions in core.game!
    if (
        hasSkill(
            ratings,
            COMPOSITE_WEIGHTS.shootingThreePointer.ratings,
            COMPOSITE_WEIGHTS.shootingThreePointer.weights,
        )
    ) {
        // Purposely let more 3 point shooters have this skill, it just feels right
        sk.push("3");
    }
    if (
        hasSkill(
            ratings,
            COMPOSITE_WEIGHTS.athleticism.ratings,
            COMPOSITE_WEIGHTS.athleticism.weights,
            0.55,
        )
    ) {
        sk.push("A");
    }
    if (
        hasSkill(
            ratings,
            COMPOSITE_WEIGHTS.dribbling.ratings,
            COMPOSITE_WEIGHTS.dribbling.weights,
        )
    ) {
        sk.push("B");
    }
    if (
        hasSkill(
            ratings,
            COMPOSITE_WEIGHTS.defenseInterior.ratings,
            COMPOSITE_WEIGHTS.defenseInterior.weights,
            0.53,
        )
    ) {
        sk.push("Di");
    }
    if (
        hasSkill(
            ratings,
            COMPOSITE_WEIGHTS.defensePerimeter.ratings,
            COMPOSITE_WEIGHTS.defensePerimeter.weights,
            0.53,
        )
    ) {
        sk.push("Dp");
    }
    if (
        hasSkill(
            ratings,
            COMPOSITE_WEIGHTS.shootingLowPost.ratings,
            COMPOSITE_WEIGHTS.shootingLowPost.weights,
        )
    ) {
        sk.push("Po");
    }
    if (
        hasSkill(
            ratings,
            COMPOSITE_WEIGHTS.passing.ratings,
            COMPOSITE_WEIGHTS.passing.weights,
        )
    ) {
        sk.push("Ps");
    }
    if (
        hasSkill(
            ratings,
            COMPOSITE_WEIGHTS.rebounding.ratings,
            COMPOSITE_WEIGHTS.rebounding.weights,
            0.6,
        )
    ) {
        sk.push("R");
    }

    return sk;
};

export default skills;
