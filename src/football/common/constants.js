// @flow

import type { CompositeWeights } from "../../deion/common/types";
import type { RatingKey } from "./types";

const COMPOSITE_WEIGHTS: CompositeWeights<RatingKey> = {
    passingAccuracy: {
        ratings: ["tha", "hgt"],
        weights: [1, 0.2],
        skill: {
            label: "Pa",
        },
    },
    passingDeep: {
        ratings: ["thp", "tha", "hgt"],
        weights: [1, 0.1, 0.2],
        skill: {
            label: "Pd",
        },
    },
    passingVision: {
        ratings: ["thv", "hgt"],
        weights: [1, 0.5],
        skill: {
            label: "Ps",
        },
    },
    athleticism: {
        ratings: ["str", "spd", "hgt"],
        weights: [1, 1, 0.2],
        skill: {
            label: "A",
        },
    },
    running: {
        ratings: ["str", "spd", "elu"],
        weights: [0.5, 1, 1],
        skill: {
            label: "X",
        },
    },
    catching: {
        ratings: ["hgt", "hnd"],
        weights: [0.2, 1],
        skill: {
            label: "H",
        },
    },
    gettingOpen: {
        ratings: ["hgt", "spd", "rtr", "hnd"],
        weights: [1, 1, 2, 1],
    },
    passBlocking: {
        ratings: ["hgt", "str", "spd", "pbk"],
        weights: [0.5, 1, 0.2, 1],
        skill: {
            label: "Bp",
        },
    },
    runBlocking: {
        ratings: ["hgt", "str", "spd", "rbk"],
        weights: [0.5, 1, 0.4, 1],
        skill: {
            label: "Br",
        },
    },
    passRushing: {
        ratings: ["hgt", "str", "spd", "prs"],
        weights: [1, 1, 0.5, 1],
        skill: {
            label: "PR",
        },
    },
    runStopping: {
        ratings: ["hgt", "str", "spd", "rns"],
        weights: [0.5, 1, 0.5, 1],
        skill: {
            label: "RS",
        },
    },
    passCoverage: {
        ratings: ["hgt", "spd", "pcv"],
        weights: [0.1, 1, 1],
        skill: {
            label: "L",
        },
    },
    snapping: {
        ratings: ["snp"],
    },
    avoidingSacks: {
        ratings: ["thv", "elu", "str"],
        weights: [0.5, 1, 0.25],
    },
    ballSecurity: {
        ratings: ["bls", "str"],
        weights: [1, 0.2],
    },
    pace: {
        ratings: ["spd", "endu"],
    },
    endurance: {
        ratings: [50, "endu"],
        weights: [1, 1],
    },
};

const POSITIONS = [
    "QB",
    "RB",
    "WR",
    "TE",
    "C",
    "OL",
    "DL",
    "LB",
    "CB",
    "S",
    "K",
    "P",
    "KR",
    "PR",
];

export { COMPOSITE_WEIGHTS, POSITIONS };
