// @flow

export type BackboardTx = any;

export type Game = {
    att: number,
    gid: number,
    lost: {tid: number, pts: number},
    playoffs: boolean,
    season: number,
    teams: [Object, Object],
    won: {tid: number, pts: number},
};

// Missing tons, but doesn't matter because setGameAttributes doesn't use it yet
export type GameAttributeKeyDynamic = (
    'gamesInProgress' |
    'godMode' |
    'phaseChangeInProgress' |
    'stopGames'
);

/*export type GameAttributeKeyStatic = (
    'autoPlaySeasons' |
    'confs' |
    'daysLeft' |
    'disableInjuries' |
    'divs' |
    'gameOver' |
    'gamesInProgress' |
    'godMode' |
    'godModeInPast' |
    'lastDbChange' |
    'luxuryPayroll' |
    'luxuryTax' |
    'maxContract' |
    'minContract' |
    'minPayroll' |
    'minRosterSize' |
    'nextPhase' |
    'numGames' |
    'numPlayoffRounds' |
    'ownerMood' |
    'phase' |
    'phaseChangeInProgress' |
    'quarterLength' |
    'salaryCap' |
    'showFirstOwnerMessage' |
    'stopGames'
);*/

export type GameProcessed = {
    gid: number,
    home: boolean,
    oppPts: number,
    oppTid: number,
    oppAbbrev: number,
    overtime: string,
    tid: number,
    pts: number,
    won: boolean,
};

export type GameProcessedCompleted = {
    gid: number,
    overtime: string,
    score: string,
    teams: [Object, Object],
    won: boolean,
};

export type OwnerMoodDeltas = {
    money: number,
    playoffs: number,
    wins: number,
};

export type Pick = {
    dpid: number,
    originalTid: number,
    round: number,
    season: number,
    tid: number,
};

export type PickRealized = {
    originalTid: number,
    pick: number,
    round: number,
    tid: number,
};

export type PlayerFiltered = any;

export type PlayerInjury = {
    gamesRemaining: number,
    type: string,
};

export type ContractInfo = {
    pid: number,
    firstName: string,
    lastName: string,
    skills: string[],
    injury: PlayerInjury,
    amount: number,
    exp: number,
    released: boolean,
};

export type RatingKey = (
    'blk' |
    'dnk' |
    'drb' |
    'endu' |
    'fg' |
    'ft' |
    'hgt' |
    'ins' |
    'jmp' |
    'pss' |
    'reb' |
    'spd' |
    'stl' |
    'stre' |
    'tp'
);

export type ScheduleGame = {
    awayName: string,
    awayRegion: string,
    awayTid: number,
    gid: number,
    highlight: boolean,
    homeName: string,
    homeRegion: string,
    homeTid: number,
};

export type Team = {
    tid: number,
    cid: number,
    did: number,
    region: string,
    name: string,
    abbrev: string,
    imgURL?: string,
    budget: any,
    strategy: any,
};

export type TeamBasic = {
    tid: number,
    cid: number,
    did: number,
    region: string,
    name: string,
    abbrev: string,
    pop: number,
    popRank?: number,
    imgURL?: string,
};

export type TeamFiltered = any;

export type TeamSeason = any;

export type TeamStats = any;

export type TradePickValues = {
    [key: string]: number[],
};

type TradeSummaryTeam = {
    name: string,
    payrollAfterTrade: number,
    picks: {
        dpid: number,
        desc: string,
    }[],
    total: number,
    trade: PlayerFiltered[],
};

export type TradeSummary = {
    teams: [TradeSummaryTeam, TradeSummaryTeam],
    warning: null | string,
};

type TradeTeam = {
    dpids: number[],
    pids: number[],
    tid: number,
};

export type TradeTeams = [TradeTeam, TradeTeam];

export type UpdateEvents = (
    'firstRun' |
    'g.gamesInProgress' |
    'newPhase' |
    'playerMovement'
)[];
