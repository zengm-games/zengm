// @flow

const PHASE = {
    FANTASY_DRAFT: -1,
    PRESEASON: 0,
    REGULAR_SEASON: 1,
    AFTER_TRADE_DEADLINE: 2,
    PLAYOFFS: 3,
    DRAFT_LOTTERY: 4,
    DRAFT: 5,
    AFTER_DRAFT: 6,
    RESIGN_PLAYERS: 7,
    FREE_AGENCY: 8,
};

const PLAYER = {
    FREE_AGENT: -1,
    UNDRAFTED: -2,
    RETIRED: -3,
    UNDRAFTED_2: -4, // Next year's draft class
    UNDRAFTED_3: -5, // Next next year's draft class
    UNDRAFTED_FANTASY_TEMP: -6, // Store current draft class here during fantasy draft
};

const PHASE_TEXT = {
    "-1": "fantasy draft",
    "0": "preseason",
    "1": "regular season",
    "2": "regular season",
    "3": "playoffs",
    "4": "draft lottery",
    "5": "draft",
    "6": "after draft",
    "7": "re-sign players",
    "8": "free agency",
};

const SPORT = "basketball"; // For account ajax stuff

const COMPOSITE_WEIGHTS = {
    pace: {
        ratings: ["spd", "jmp", "dnk", "tp", "drb", "pss"],
    },
    usage: {
        ratings: ["ins", "dnk", "fg", "tp", "spd", "drb", "oiq"],
        weights: [1.5, 1, 1, 1, 0.15, 0.15, 0.5],
    },
    dribbling: {
        ratings: ["drb", "spd"],
    },
    passing: {
        ratings: ["drb", "pss", "oiq"],
        weights: [0.4, 1, 0.5],
    },
    turnovers: {
        ratings: ["drb", "pss", "spd", "hgt", "ins", "oiq"],
        weights: [1, 1, -1, 1, 1, -1],
    },
    shootingAtRim: {
        ratings: ["hgt", "spd", "jmp", "dnk", "oiq"],
        weights: [0.5, 0.2, 0.6, 0.4, 0.2],
    },
    shootingLowPost: {
        ratings: ["hgt", "stre", "spd", "ins", "oiq"],
        weights: [2, 0.6, 0.2, 1, 0.2],
    },
    shootingMidRange: {
        ratings: ["oiq", "fg"],
        weights: [-0.5, 1],
    },
    shootingThreePointer: {
        ratings: ["oiq", "tp"],
        weights: [0.1, 1],
    },
    shootingFT: {
        ratings: ["ft"],
    },
    rebounding: {
        ratings: ["hgt", "stre", "jmp", "reb", "oiq", "diq"],
        weights: [3, 0.1, 0.1, 0.7, 0.5, 0.5],
    },
    stealing: {
        ratings: [50, "spd", "diq"],
        weights: [1, 1, 2],
    },
    blocking: {
        ratings: ["hgt", "jmp", "diq"],
        weights: [2, 1.5, 0.5],
    },
    fouling: {
        ratings: [50, "hgt", "diq", "spd"],
        weights: [1.5, 1, -1, -1],
    },
    defense: {
        ratings: ["hgt", "stre", "spd", "jmp", "diq"],
        weights: [1, 1, 1, 0.5, 1, 2],
    },
    defenseInterior: {
        ratings: ["hgt", "stre", "spd", "jmp", "diq"],
        weights: [2, 1, 0.5, 0.5, 2],
    },
    defensePerimeter: {
        ratings: ["hgt", "stre", "spd", "jmp", "diq"],
        weights: [0.5, 1, 2, 0.5, 1],
    },
    endurance: {
        ratings: [50, "endu"],
        weights: [1, 1],
    },
    athleticism: {
        ratings: ["stre", "spd", "jmp", "hgt"],
        weights: [1, 1, 1, 0.5],
    },
};

// Test: pk_test_gFqvUZCI8RgSl5KMIYTmZ5yI
const STRIPE_PUBLISHABLE_KEY = "pk_live_Dmo7Vs6uSaoYHrFngr4lM0sa";

export {
    COMPOSITE_WEIGHTS,
    PHASE,
    PLAYER,
    PHASE_TEXT,
    SPORT,
    STRIPE_PUBLISHABLE_KEY,
};
