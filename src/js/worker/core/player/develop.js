// @flow

import orderBy from "lodash/orderBy";
import range from "lodash/range";
import { PLAYER, g, helpers } from "../../../common";
import limitRating from "./limitRating";
import ovr from "./ovr";
import pos from "./pos";
import skills from "./skills";
import { random } from "../../util";
import type {
    PlayerRatings,
    PlayerSkill,
    RatingKey,
} from "../../../common/types";

const shootingFormula = {
    ageModifier: (age: number) => {
        // Reverse most of the age-related decline in calcBaseChange
        if (age <= 27) {
            return 0;
        }
        if (age <= 29) {
            return 0.5;
        }
        if (age <= 31) {
            return 1.5;
        }
        return 2;
    },
    changeLimits: () => [-3, 13],
};

const iqFormula = {
    ageModifier: (age: number) => {
        if (age <= 21) {
            return 4;
        }
        if (age <= 23) {
            return 3;
        }

        // Reverse most of the age-related decline in calcBaseChange
        if (age <= 27) {
            return 0;
        }
        if (age <= 29) {
            return 0.5;
        }
        if (age <= 31) {
            return 1.5;
        }
        return 2;
    },
    changeLimits: age => {
        if (age > 24) {
            return [-3, 9];
        }

        // For 19: [-3, 32]
        // For 23: [-3, 12]
        return [-3, 7 + 5 * (24 - age)];
    },
};

const ratingsFormulas: {
    [key: RatingKey]: {
        ageModifier?: number => number,
        changeLimits?: number => [number, number],
    },
} = {
    stre: {},
    spd: {
        ageModifier: (age: number) => {
            if (age <= 27) {
                return 0;
            }
            if (age <= 30) {
                return -2;
            }
            return -4;
        },
        changeLimits: () => [-12, 2],
    },
    jmp: {
        ageModifier: (age: number) => {
            if (age <= 26) {
                return 0;
            }
            if (age <= 30) {
                return -3;
            }
            return -5;
        },
        changeLimits: () => [-12, 2],
    },
    endu: {
        ageModifier: (age: number) => {
            if (age <= 23) {
                return random.uniform(0, 9);
            }
            if (age <= 30) {
                return 0;
            }
            return -4;
        },
        changeLimits: () => [-11, 19],
    },
    dnk: shootingFormula,
    ins: shootingFormula,
    ft: shootingFormula,
    fg: shootingFormula,
    tp: shootingFormula,
    oiq: iqFormula,
    diq: iqFormula,
    drb: {
        ageModifier: shootingFormula.ageModifier,
        changeLimits: () => [-2, 5],
    },
    pss: {
        ageModifier: shootingFormula.ageModifier,
        changeLimits: () => [-2, 5],
    },
    reb: {
        ageModifier: shootingFormula.ageModifier,
        changeLimits: () => [-2, 5],
    },
};

const calcBaseChange = (age: number, coachingRank: number): number => {
    let val;

    if (age <= 21) {
        val = 2;
    } else if (age <= 25) {
        val = 1;
    } else if (age <= 27) {
        val = 0;
    } else if (age <= 29) {
        val = -1;
    } else if (age <= 31) {
        val = -2;
    } else if (age <= 34) {
        val = -3;
    } else {
        val = -4;
    }

    // Noise
    if (age <= 23) {
        val += helpers.bound(random.realGauss(0, 5), -4, 20);
    } else if (age <= 25) {
        val += helpers.bound(random.realGauss(0, 5), -4, 10);
    } else {
        val += helpers.bound(random.realGauss(0, 3), -2, 4);
    }

    // Modulate by coaching. g.numTeams doesn't exist when upgrading DB, but that doesn't matter
    if (g.hasOwnProperty("numTeams")) {
        if (val >= 0) {
            val *= (coachingRank - 1) * -0.5 / (g.numTeams - 1) + 1.25;
        } else {
            val *= (coachingRank - 1) * 0.5 / (g.numTeams - 1) + 0.75;
        }
    }

    return val;
};

const developSeason = (
    ratings: PlayerRatings,
    age: number,
    coachingRank?: number = 15.5,
) => {
    // In young players, height can sometimes increase
    if (age <= 21) {
        const heightRand = Math.random();
        if (heightRand > 0.99 && age <= 20) {
            ratings.hgt += 1;
        }
        if (heightRand > 0.999) {
            ratings.hgt += 1;
        }
    }

    const baseChange = calcBaseChange(age, coachingRank);

    for (const key of Object.keys(ratingsFormulas)) {
        const ageModifier = ratingsFormulas[key].ageModifier
            ? ratingsFormulas[key].ageModifier(age)
            : 0;
        const changeLimits = ratingsFormulas[key].changeLimits
            ? ratingsFormulas[key].changeLimits(age)
            : [-Infinity, Infinity];

        ratings[key] = limitRating(
            ratings[key] +
                helpers.bound(
                    (baseChange + ageModifier) * random.uniform(0.4, 1.4),
                    changeLimits[0],
                    changeLimits[1],
                ),
        );
    }
};

// Repeatedly simulate aging up to 29, and pick the 75th percentile max
const NUM_SIMULATIONS = 20; // Higher is more accurate, but slower. Low accuracy is fine, though!
export const bootstrapPot = (ratings: PlayerRatings, age: number): number => {
    if (age >= 29) {
        return ratings.ovr;
    }

    const maxOvrs = range(NUM_SIMULATIONS).map(() => {
        const copiedRatings = helpers.deepCopy(ratings);

        let maxOvr = ratings.ovr;
        for (let ageTemp = age + 1; ageTemp < 30; ageTemp++) {
            developSeason(copiedRatings, ageTemp); // Purposely no coachingRank
            const currentOvr = ovr(copiedRatings);
            if (currentOvr > maxOvr) {
                maxOvr = currentOvr;
            }
        }

        return maxOvr;
    });

    return orderBy(maxOvrs)[Math.floor(0.75 * NUM_SIMULATIONS)];
};

/**
 * Develop (increase/decrease) player's ratings. This operates on whatever the last row of p.ratings is.
 *
 * Make sure to call updateValues after this! Otherwise, player values will be out of sync.
 *
 * @memberOf core.player
 * @param {Object} p Player object.
 * @param {number=} years Number of years to develop (default 1).
 * @param {boolean=} newPlayer Generating a new player? (default false). If true, then the player's age is also updated based on years.
 * @param {number=} coachingRank From 1 to g.numTeams (default 30), where 1 is best coaching staff and g.numTeams is worst. Default is 15.5
 * @return {Object} Updated player object.
 */
const develop = (
    p: {
        born: { loc: string, year: number },
        draft: { ovr: number, pot: number, skills: PlayerSkill[] },
        pos?: string,
        ratings: PlayerRatings[],
        tid: number,
    },
    years?: number = 1,
    newPlayer?: boolean = false,
    coachingRank?: number = 15.5,
    skipPot?: boolean = false, // Only for making testing or core/debug faster
) => {
    const ratings = p.ratings[p.ratings.length - 1];

    let age = g.season - p.born.year;

    for (let i = 0; i < years; i++) {
        // (CONFUSING!) Don't increment age for existing players developing one season (i.e. newPhasePreseason) because the season is already incremented before this function is called. But in other scenarios (new league and draft picks), the season is not changing, so age should be incremented every iteration of this loop.
        if (newPlayer || years > 1) {
            age += 1;
        }

        developSeason(ratings, age, coachingRank);
    }

    // Run these even for players developing 0 seasons
    ratings.ovr = ovr(ratings);
    if (!skipPot) {
        ratings.pot = bootstrapPot(ratings, age);
    }
    ratings.skills = skills(ratings);

    if (
        p.tid === PLAYER.UNDRAFTED ||
        p.tid === PLAYER.UNDRAFTED_2 ||
        p.tid === PLAYER.UNDRAFTED_3
    ) {
        p.draft.ovr = ratings.ovr;
        if (!skipPot) {
            p.draft.pot = ratings.pot;
        }
        p.draft.skills = ratings.skills;
    }

    if (newPlayer) {
        p.born.year = g.season - age;
    }

    if (p.hasOwnProperty("pos") && typeof p.pos === "string") {
        // Must be a custom league player, let's not rock the boat
        ratings.pos = p.pos;
    } else {
        ratings.pos = pos(ratings);
    }
};

export default develop;
