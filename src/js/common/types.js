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

type AwardTeam = {
    tid: number,
    abbrev: string,
    region: string,
    name: string,
    won: number,
    lost: number,
};

type AwardPlayer = {
    pid: number,
    name: string,
    tid: number,
    abbrev: string,
    pts: number,
    trb: number,
    ast: number,
};

type AwardPlayerDefense = {
    pid: number,
    name: string,
    tid: number,
    abbrev: string,
    trb: number,
    blk: number,
    stl: number,
};

export type Awards = {
    season: number,
    bestRecord: AwardTeam,
    bestRecordConfs: [
        AwardTeam,
        AwardTeam,
    ],
    roy: AwardPlayer,
    allRookie: [
        AwardPlayer,
        AwardPlayer,
        AwardPlayer,
        AwardPlayer,
        AwardPlayer,
    ],
    mvp: AwardPlayer,
    smoy: AwardPlayer,
    allLeague: [
        {
            title: 'First Team',
            players: [
                AwardPlayer,
                AwardPlayer,
                AwardPlayer,
                AwardPlayer,
                AwardPlayer,
            ]
        },
        {
            title: 'Second Team',
            players: [
                AwardPlayer,
                AwardPlayer,
                AwardPlayer,
                AwardPlayer,
                AwardPlayer,
            ]
        },
        {
            title: 'Third Team',
            players: [
                AwardPlayer,
                AwardPlayer,
                AwardPlayer,
                AwardPlayer,
                AwardPlayer,
            ]
        },
    ],
    dpoy: AwardPlayerDefense,
    allDefensive: [
        {
            title: 'First Team',
            players: [
                AwardPlayerDefense,
                AwardPlayerDefense,
                AwardPlayerDefense,
                AwardPlayerDefense,
                AwardPlayerDefense,
            ]
        },
        {
            title: 'Second Team',
            players: [
                AwardPlayerDefense,
                AwardPlayerDefense,
                AwardPlayerDefense,
                AwardPlayerDefense,
                AwardPlayerDefense,
            ]
        },
        {
            title: 'Third Team',
            players: [
                AwardPlayerDefense,
                AwardPlayerDefense,
                AwardPlayerDefense,
                AwardPlayerDefense,
                AwardPlayerDefense,
            ]
        },
    ],
    finalsMvp: AwardPlayer,
};

export type BackboardTx = any;

export type DraftOrder = any;

export type DraftPick = any;

export type EventBBGM = any;

export type Env = {
    enableLogging: boolean,
    inCordova: boolean,
    tld: string,
};

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

export type GameAttributeKey = (
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

export type GameAttribute = {
    key: GameAttributeKey,
    value: any,
};

export type GameAttributes = {[key: GameAttributeKey]: any};

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

export type LogEventType = (
    'achievement' |
    'award' |
    'changes' |
    'draft' |
    'error' |
    'freeAgent' |
    'gameLost' |
    'gameWon' |
    'hallOfFame' |
    'healed' |
    'injured' |
    'playerFeat' |
    'playoffs' |
    'reSigned' |
    'refuseToSign' |
    'release' |
    'retired' |
    'screenshot' |
    'trade' |
    'tragedy'
);

export type LogEventSaveOptions = {
    type: LogEventType,
    text: string,
    pids?: number[],
    tids?: number[],
};

export type LogEventShowOptions = {
    extraClass?: string,
    persistent: boolean,
    text: string,
    type: string,
};

export type Message = {
    from: string,
    read: boolean,
    text: string,
    year: number,
};

export type MessageWithMid = Message & {mid: number};

export type Negotiation = {
    pid: number,
    tid: number,
    team: {amount: number, years: number},
    player: {amount: number, years: number},
    orig: {amount: number, years: number},
    resigning: boolean,
};

export type Option = {
    id: string,
    label: string,
    url?: string,
};

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

export type PlayerFeat = {
    fid?: number,
    pid: number,
    name: string,
    pos: string,
    season: number,
    tid: number,
    oppTid: number,
    playoffs: boolean,
    gid: number,
    stats: any,
    won: boolean,
    score: string,
    overtimes: number,
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

type PlayoffSeriesTeam = {
    cid: number,
    seed: number,
    tid: number,
    won: number,
};

export type PlayoffSeries = {
    season: number,
    currentRound: number,
    series: {
        home: PlayoffSeriesTeam,
        away: PlayoffSeriesTeam,
    }[][],
};

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

export type ReleasedPlayer = {
    pid: number,
    tid: number,
    contract: PlayerContract,
};

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

export type Trade = {
    rid: 0,
    teams: TradeTeams,
};

export type UpdateEvents = (
    'account' |
    'clearWatchList' |
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
