import type {GameAttributes} from '../../common/types';

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
    numGames: 82, // per season
    quarterLength: 12, // [minutes]
    disableInjuries: false,
    confs: [
        {cid: 0, name: "Eastern Conference"},
        {cid: 1, name: "Western Conference"},
    ],
    divs: [
        {did: 0, cid: 0, name: "Atlantic"},
        {did: 1, cid: 0, name: "Central"},
        {did: 2, cid: 0, name: "Southeast"},
        {did: 3, cid: 1, name: "Southwest"},
        {did: 4, cid: 1, name: "Northwest"},
        {did: 5, cid: 1, name: "Pacific"},
    ],
    numPlayoffRounds: 4,
    aiTrades: true,
};

export default defaultGameAttributes;
