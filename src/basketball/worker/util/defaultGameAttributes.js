import type { GameAttributes } from "../../../deion/common/types";

// Additional league-specific attributes (userTid, userTids, season, ...) are set when creating a new league

const defaultGameAttributes: GameAttributes = {
    phase: 0,
    nextPhase: null, // Used only for fantasy draft
    daysLeft: 0, // Used only for free agency
    ownerMood: {
        wins: 0,
        playoffs: 0,
        money: 0,
    },
    gameOver: false,
    showFirstOwnerMessage: true, // true when user starts with a new team, so initial owner message can be shown
    godMode: false,
    godModeInPast: false,
    salaryCap: 90000, // [thousands of dollars]
    minPayroll: 60000, // [thousands of dollars]
    luxuryPayroll: 100000, // [thousands of dollars]
    luxuryTax: 1.5,
    minContract: 750, // [thousands of dollars]
    maxContract: 30000, // [thousands of dollars]
    minRosterSize: 10,
    maxRosterSize: 15,
    numGames: 82, // per season
    quarterLength: 12, // [minutes]
    disableInjuries: false,
    confs: [
        { cid: 0, name: "Eastern Conference" },
        { cid: 1, name: "Western Conference" },
    ],
    divs: [
        { did: 0, cid: 0, name: "Atlantic" },
        { did: 1, cid: 0, name: "Central" },
        { did: 2, cid: 0, name: "Southeast" },
        { did: 3, cid: 1, name: "Southwest" },
        { did: 4, cid: 1, name: "Northwest" },
        { did: 5, cid: 1, name: "Pacific" },
    ],
    numGamesPlayoffSeries: [7, 7, 7, 7],
    numPlayoffByes: 0,
    aiTrades: true,
    autoDeleteOldBoxScores: true,
    stopOnInjury: false,
    stopOnInjuryGames: 20,

    // According to data/injuries.ods, 0.25 injuries occur every game. Divided over 10 players and ~200 possessions, that means each player on the court has P = 0.25 / 10 / 200 = 0.000125 probability of being injured this play.
    injuryRate: 0.25 / 10 / 200,

    // The tragic death rate is the probability that a player will die a tragic death on a given regular season day. Yes, this only happens in the regular season. With roughly 100 days in a season, the default is about one death every 50 years.
    tragicDeathRate: 1 / (100 * 50),

    // The probability that a new player will be the son or brother of an existing player. In practice, the observed number may be smaller than this because sometimes a valid match will not be found.
    sonRate: 0.02,
    brotherRate: 0.02,

    // See constants.DIFFICULTY for values
    difficulty: 0,
    easyDifficultyInPast: false,

    hardCap: false,
};

export default defaultGameAttributes;
