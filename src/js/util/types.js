// @flow

export type AchievementKey = (
    'participation' |
    'fo_fo_fo' |
    'septuawinarian' |
    '98_degrees' |
    'dynasty' |
    'dynasty_2' |
    'dynasty_3' |
    'moneyball' |
    'moneyball_2' |
    'hardware_store' |
    'small_market' |
    'sleeper_pick' |
    'hacker'
);

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

export type GamePlayer = any;

export type GameResults = any;

export type GameAttributeKeyDynamic = (
    'autoPlaySeasons' |
    'confs' |
    'daysLeft' |
    'disableInjuries' |
    'divs' |
    'gameOver' |
    'gamesInProgress' |
    'godMode' |
    'godModeInPast' |
    'gracePeriodEnd' |
    'lastDbChange' |
    'leagueName' |
    'lid' |
    'luxuryPayroll' |
    'luxuryTax' |
    'maxContract' |
    'minContract' |
    'minPayroll' |
    'minRosterSize' |
    'names' |
    'nextPhase' |
    'numGames' |
    'numPlayoffRounds' |
    'numTeams' |
    'ownerMood' |
    'phase' |
    'phaseChangeInProgress' |
    'phaseText' |
    'quarterLength' |
    'salaryCap' |
    'season' |
    'showFirstOwnerMessage' |
    'startingSeason' |
    'statusText' |
    'stopGames' |
    'teamAbbrevsCache' |
    'teamNamesCache' |
    'teamRegionsCache' |
    'userTid' |
    'userTids'
);

type GameAttributeKeyStatic = (
    'PHASE' |
    'PHASE_TEXT' |
    'PLAYER' |
    'compositeWeights' |
    'dbl' |
    'dbm' |
    'emitter' |
    'enableLogging' |
    'notInDb' |
    'sport' |
    'stripePublishableKey' |
    'tld'
);

export type GameAttributes = {[key: GameAttributeKeyDynamic | GameAttributeKeyStatic]: any}

export type GameProcessed = {
    gid: number,
    home: boolean,
    oppPts: number,
    oppTid: number,
    oppAbbrev: number,
    overtime: string,
    tid?: number,
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

export type GetOutput = {[key: string]: ?(number | string)};

export type Message = {
    from: string,
    read: boolean,
    text: string,
    year: number,
};

export type MessageWithMid = Message & {mid: number};

export type OwnerMoodDeltas = {
    money: number,
    playoffs: number,
    wins: number,
};

export type PageCtx = {[key: string]: any};

export type Phase = -1 | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

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

export type PlayerContract = {
    amount: number,
    exp: number,
};

export type PlayerFiltered = any;

export type PlayerInjury = {
    gamesRemaining: number,
    type: string,
};

export type PlayerSkill = '3' | 'A' | 'B' | 'Di' | 'Dp' | 'Po' | 'Ps' | 'R';

export type PlayerRatings = {
    blk: number,
    dnk: number,
    drb: number,
    endu: number,
    fg: number,
    ft: number,
    fuzz: number,
    hgt: number,
    ins: number,
    jmp: number,
    ovr: number,
    pos: string,
    pot: number,
    pss: number,
    reb: number,
    season: number,
    spd: number,
    skills: PlayerSkill[],
    stl: number,
    stre: number,
    tp: number,
};

export type PlayerSalary = {
    amount: number,
    season: number,
};

export type PlayerStats = any;

export type PlayerWithoutPid = {
    awards: {
        season: number,
        type: string,
    }[],
    born: {
        year: number,
        loc: string,
    },
    college: string,
    contract: PlayerContract,
    diedYear?: number,
    draft: {
        round: number,
        pick: number,
        tid: number,
        originalTid: number,
        year: number,
        teamName: null | string,
        teamRegion: null | string,
        pot: number,
        ovr: number,
        skills: PlayerSkill[],
    },
    face: Object,
    firstName: string,
    freeAgentMood: number[],
    gamesUntilTradable: number,
    hgt: number,
    hof: boolean,
    imgURL: string,
    injury: PlayerInjury,
    lastName: string,
    pos?: string, // Only in players from custom league files
    ptModifier: number,
    ratings: PlayerRatings[],
    retiredYear: null | number,
    rosterOrder: number,
    salaries: PlayerSalary[],
    statsTids: number[],
    tid: number,
    value: number,
    valueNoPot: number,
    valueFuzz: number,
    valueNoPotFuzz: number,
    valueWithContract: number,
    watch: boolean,
    weight: number,
    yearsFreeAgent: number,
};

export type Player = PlayerWithoutPid & {pid: number};

export type PlayerWithStats = Player & {stats: PlayerStats[]};

export type ContractInfo = {
    pid: number,
    firstName: string,
    lastName: string,
    skills: PlayerSkill[],
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

export type SortOrder = 'asc' | 'desc';

export type SortType = 'currency' | 'draftPick' | 'lastTen' | 'name' | 'number';

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
    'account' |
    'clearWatchList' |
    'dbChange' |
    'firstRun' |
    'g.gamesInProgress' |
    'g.userTids' |
    'gameSim' |
    'newPhase' |
    'playerMovement' |
    'toggleGodMode' |
    'watchList'
)[];

export type RunFunction = (
    inputs: GetOutput,
    updateEvents: UpdateEvents,
    state: any,
    setState: (state: any) => void,
    topMenu: any,
) => Promise<void | {[key: string]: any}>;
