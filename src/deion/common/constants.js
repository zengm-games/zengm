// @flow

const DIFFICULTY = {
    Easy: -0.25,
    Normal: 0,
    Hard: 0.25,
    Insane: 1,
};

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
    "4": process.env.SPORT === "basketball" ? "draft lottery" : "before draft",
    "5": "draft",
    "6": "after draft",
    "7": "re-sign players",
    "8": "free agency",
};

// Test: pk_test_gFqvUZCI8RgSl5KMIYTmZ5yI
const STRIPE_PUBLISHABLE_KEY = "pk_live_Dmo7Vs6uSaoYHrFngr4lM0sa";

export { DIFFICULTY, PHASE, PLAYER, PHASE_TEXT, STRIPE_PUBLISHABLE_KEY };
