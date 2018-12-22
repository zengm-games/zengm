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

const PLAYER_STATS_TABLES = {
    passing: {
        name: "Passing",
        stats: [
            "gp",
            "gs",
            "pssCmp",
            "pss",
            "pssYds",
            "pssTD",
            "pssInt",
            "pssLng",
            "pssSk",
            "pssSkYds",
        ],
    },
    rushing: {
        name: "Rushing and Receiving",
        stats: [
            "gp",
            "gs",
            "rus",
            "rusYds",
            "rusTD",
            "rusLng",
            "tgt",
            "rec",
            "recYds",
            "recTD",
            "recLng",
        ],
    },
    defense: {
        name: "Defense, Fumbles, and Penalties",
        stats: [
            "gp",
            "gs",
            "defInt",
            "defIntYds",
            "defIntTD",
            "defIntLng",
            "defPssDef",
            "defFmbFrc",
            "defFmbRec",
            "defFmbYds",
            "defFmbTD",
            "defSk",
            "defTckSolo",
            "defTckAst",
            "defTckLoss",
            "defSft",
            "fmb",
            "fmbLost",
            "pen",
            "penYds",
        ],
    },
    kicking: {
        name: "Kicking and Punting",
        stats: [
            "gp",
            "gs",
            "fg0",
            "fga0",
            "fg20",
            "fga20",
            "fg30",
            "fga30",
            "fg40",
            "fga40",
            "fg50",
            "fga50",
            "fgLng",
            "xp",
            "xpa",
            "pnt",
            "pntYds",
            "pntLng",
            "pntBlk",
        ],
    },
    returns: {
        name: "Kick and Punt Returns",
        stats: [
            "gp",
            "gs",
            "pr",
            "prYds",
            "prTD",
            "prLng",
            "kr",
            "krYds",
            "krTD",
            "krLng",
        ],
    },
};

const TEAM_STATS_TABLES = {
    team: {
        name: "Team",
        stats: [
            "pts",
            "yds",
            "ply",
            "ydsPerPlay",
            "tov",
            "fmbLost",
            "pssCmp",
            "pss",
            "pssYds",
            "pssTD",
            "pssInt",
            "pssNetYdsPerAtt",
            "rus",
            "rusYds",
            "rusTD",
            "rusYdsPerAtt",
            "pen",
            "penYds",
            "drives",
            "drivesScoringPct",
            "drivesTurnoverPct",
            "avgFieldPosition",
            "timePerDrive",
            "playsPerDrive",
            "ydsPerDrive",
            "ptsPerDrive",
        ],
    },
    opponent: {
        name: "Opponent",
        stats: [],
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

const RATINGS: RatingKey[] = [
    "hgt",
    "stre",
    "spd",
    "endu",
    "thv",
    "thp",
    "tha",
    "bls",
    "elu",
    "rtr",
    "hnd",
    "rbk",
    "pbk",
    "snp",
    "pcv",
    "prs",
    "rns",
    "kpw",
    "kac",
    "ppw",
    "pac",
];

export {
    COMPOSITE_WEIGHTS,
    PLAYER_STATS_TABLES,
    POSITIONS,
    RATINGS,
    TEAM_STATS_TABLES,
};
