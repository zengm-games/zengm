// @flow

import { player } from "../../../../deion/worker/core";
import { g, helpers, random } from "../../../../deion/worker/util";
import type { PlayerRatings, RatingKey } from "../../../common/types";

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
            val *= ((coachingRank - 1) * -0.5) / (g.numTeams - 1) + 1.25;
        } else {
            val *= ((coachingRank - 1) * 0.5) / (g.numTeams - 1) + 0.75;
        }
    }

    return val;
};

const developSeason = (
    ratings: PlayerRatings,
    age: number,
    coachingRank?: number = (g.numTeams + 1) / 2,
) => {
    // In young players, height can sometimes increase
    if (age <= 21) {
        const heightRand = Math.random();
        if (heightRand > 0.99 && age <= 20 && ratings.hgt <= 99) {
            ratings.hgt += 1;
        }
        if (heightRand > 0.999 && ratings.hgt <= 99) {
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

        ratings[key] = player.limitRating(
            ratings[key] +
                helpers.bound(
                    (baseChange + ageModifier) * random.uniform(0.4, 1.4),
                    changeLimits[0],
                    changeLimits[1],
                ),
        );
    }
};

export default developSeason;
