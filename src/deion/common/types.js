// @flow

export type Achievements = {
    [key: string]: {
        name: string,
        desc: string,
        check: () => Promise<boolean>,
    },
};

export type BackboardTx = any;

export type CompositeWeights<RatingKey = string> = {
    [key: string]: {
        ratings: (RatingKey | number)[],
        weights?: number[],
        skill?: {
            label: string,
            cutoff: number,
        },
    },
};

// Not exact because https://github.com/facebook/flow/issues/2386 - same thing elsewhere
export type Conditions = {
    hostID?: number,
};

export type DraftLotteryResultArray = {|
    tid: number,
    originalTid: number,
    chances: number,
    pick?: number,
    won: number,
    lost: number,
|}[];

export type DraftLotteryResult = {|
    season: number,
    result: DraftLotteryResultArray,
|};

export type DraftPickWithoutDpid = {|
    tid: number,
    originalTid: number,
    round: number,
    pick: number, // 0 if not set
    season: number | "fantasy",
|};

export type DraftPick = {|
    ...DraftPickWithoutDpid,
    dpid: number,
|};

export type EventBBGM = any;

export type Env = {|
    enableLogging: boolean,
    heartbeatID: string,
    tld: string,
    useSharedWorker: boolean,

    // These are just legacy variables sent to the worker to be stored in idb.meta.attributes
    fromLocalStorage: { [key: string]: ?string },
|};

export type Game = {|
    att: number,
    gid: number,
    lost: {| tid: number, pts: number |},
    playoffs: boolean,
    overtimes: number,
    season: number,
    teams: [Object, Object],
    won: {| tid: number, pts: number |},
|};

export type GamePlayer = any;

export type GameResults = any;

export type GameAttributeKey =
    | "aiTrades"
    | "autoDeleteOldBoxScores"
    | "brotherRate"
    | "confs"
    | "easyDifficultyInPast"
    | "daysLeft"
    | "disableInjuries"
    | "difficulty"
    | "divs"
    | "gameOver"
    | "godMode"
    | "godModeInPast"
    | "gracePeriodEnd"
    | "hardCap"
    | "injuryRate"
    | "leagueName"
    | "lid"
    | "luxuryPayroll"
    | "luxuryTax"
    | "maxContract"
    | "maxRosterSize"
    | "minContract"
    | "minPayroll"
    | "minRosterSize"
    | "names"
    | "nextPhase"
    | "numGames"
    | "numGamesPlayoffSeries"
    | "numPlayoffByes"
    | "numPlayoffRounds" // Obsolete, just here for upgrade code
    | "numTeams"
    | "ownerMood"
    | "phase"
    | "quarterLength"
    | "salaryCap"
    | "season"
    | "showFirstOwnerMessage"
    | "sonRate"
    | "startingSeason"
    | "stopOnInjury"
    | "stopOnInjuryGames"
    | "teamAbbrevsCache"
    | "teamNamesCache"
    | "teamRegionsCache"
    | "tragicDeathRate"
    | "userTid"
    | "userTids";

export type GameAttribute = {|
    key: GameAttributeKey,
    value: any,
|};

export type GameAttributes = { [key: GameAttributeKey]: any };

export type GameProcessed = {|
    gid: number,
    home: boolean,
    oppPts: number,
    oppTid: number,
    oppAbbrev: number,
    overtime: string,
    tid?: number,
    pts: number,
    won: boolean,
|};

export type GameProcessedCompleted = {|
    gid: number,
    overtime: string,
    score: string,
    teams: [Object, Object],
    won: boolean,
|};

export type GetOutput = { [key: string]: ?(number | string) };

export type League = {|
    lid: number,
    name: string,
    tid: number,
    phaseText: string,
    teamName: string,
    teamRegion: string,
    heartbeatID?: string,
    heartbeatTimestamp?: number,
    difficulty?: number,
|};

export type Locks = {|
    drafting: boolean,
    gameSim: boolean,
    newPhase: boolean,
    stopGameSim: boolean,
|};

export type LockName = "drafting" | "newPhase" | "gameSim" | "stopGameSim";

export type LogEventType =
    | "achievement"
    | "ageFraud"
    | "award"
    | "changes"
    | "draft"
    | "error"
    | "freeAgent"
    | "gameLost"
    | "gameWon"
    | "hallOfFame"
    | "healed"
    | "injured"
    | "playerFeat"
    | "playoffs"
    | "reSigned"
    | "refuseToSign"
    | "release"
    | "retired"
    | "screenshot"
    | "trade"
    | "tragedy"
    | "upgrade";

export type LogEventSaveOptions = {|
    type: LogEventType,
    text: string,
    pids?: number[],
    tids?: number[],
|};

export type LogEventShowOptions = {|
    extraClass?: string,
    persistent: boolean,
    text: string,
    type: string,
|};

export type MessageWithoutMid = {|
    from: string,
    read: boolean,
    text: string,
    year: number,
|};

export type Message = {|
    ...MessageWithoutMid,
    mid: number,
|};

export type Negotiation = {|
    pid: number,
    tid: number,
    resigning: boolean,
|};

export type Option = {
    id: string,
    label: string,
    url?: string,
};

export type LocalStateUI = {|
    gold: boolean,
    godMode: boolean,
    hasViewedALeague: boolean,
    lid: number | void,
    leagueName: string,
    phase: number,
    phaseText: string,
    playMenuOptions: Option[],
    popup: boolean,
    season: number,
    startingSeason: number,
    statusText: string,
    teamAbbrevsCache: string[],
    teamNamesCache: string[],
    teamRegionsCache: string[],
    userTid: number,
    userTids: number[],
    username: string | void,
|};

export type OwnerMoodDeltas = {|
    money: number,
    playoffs: number,
    wins: number,
|};

export type PartialTopMenu = {|
    email: string,
    goldCancelled: boolean,
    goldUntil: number,
    username: string,
|};

export type Phase = -1 | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

export type PlayerContract = {|
    amount: number,
    exp: number,
|};

export type PlayerFeat = {|
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
|};

export type PlayerFiltered = any;

export type PlayerInjury = {|
    gamesRemaining: number,
    type: string,
|};

type PlayerSalary = {|
    amount: number,
    season: number,
|};

// ***p stats can be undefined
type PlayerStats = any;

export type RelativeType = "brother" | "father" | "son";

export type MinimalPlayerRatings = {
    ovr: number,
    pot: number,
    fuzz: number,
    pos: string,
    skills: string[],
    season: number,
    [key: string]: number,
};

export type PlayerWithoutPid<PlayerRatings = any> = {|
    awards: {|
        season: number,
        type: string,
    |}[],
    born: {|
        year: number,
        loc: string,
    |},
    college: string,
    contract: PlayerContract,
    diedYear?: number,
    draft: {|
        round: number,
        pick: number,
        tid: number,
        originalTid: number,
        year: number,
        pot: number,
        ovr: number,
        skills: string[],
    |},
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
    relatives: {
        type: RelativeType,
        pid: number,
        name: string,
    }[],
    retiredYear: number,
    rosterOrder: number,
    salaries: PlayerSalary[],
    stats: PlayerStats[],
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
|};

// Spread rather than intersection because we need it to be recognized as exact.
// https://flow.org/en/docs/types/unions/#toc-disjoint-unions-with-exact-types
// https://github.com/facebook/flow/issues/4946
export type Player<PlayerRatings = any> = {|
    ...PlayerWithoutPid<PlayerRatings>,
    pid: number,
|};

export type PlayerStatType = "per36" | "perGame" | "totals";

export type Local = {|
    autoPlaySeasons: number,
    fantasyDraftResults: Player<any>[],
    goldUntil: number,
    leagueLoaded: boolean,
    phaseText: string,
    playingUntilEndOfRound: boolean,
    statusText: string,

    reset?: () => void,
|};

export type PlayoffSeriesTeam = {|
    abbrev?: string,
    cid: number,
    seed: number,
    region?: string,
    tid: number,
    winp: number,
    won: number,
|};

export type PlayoffSeries = {|
    season: number,
    currentRound: number,
    series: {|
        home: PlayoffSeriesTeam,
        away?: PlayoffSeriesTeam,
    |}[][],
|};

export type ContractInfo = {|
    pid: number,
    firstName: string,
    lastName: string,
    skills: string[],
    injury: PlayerInjury,
    amount: number,
    exp: number,
    released: boolean,
    watch: boolean,
|};

export type ReleasedPlayer = {|
    rid: number,
    pid: number,
    tid: number,
    contract: PlayerContract,
|};

export type ReleasedPlayerWithoutRid = {|
    pid: number,
    tid: number,
    contract: PlayerContract,
|};

export type RouterContext = {|
    params: {
        [key: string]: string,
    },
    path: string,
    state: {
        [key: string]: any,
    },
|};

export type ScheduleGame = {|
    awayTid: number,
    homeTid: number,
|};

export type SortOrder = "asc" | "desc";

export type SortType = "currency" | "draftPick" | "lastTen" | "name" | "number";

export type Team = {|
    tid: number,
    cid: number,
    did: number,
    region: string,
    name: string,
    abbrev: string,
    imgURL?: string,
    budget: any,
    strategy: any,
|};

export type TeamBasic = {|
    tid: number,
    cid: number,
    did: number,
    region: string,
    name: string,
    abbrev: string,
    pop: number,
    popRank?: number,
    imgURL?: string,
|};

export type TeamAttr = string;

export type TeamSeasonAttr = string;

export type TeamStatAttr = string;

export type TeamStatType = "perGame" | "totals";

export type TeamFiltered = any;

type BudgetItem = {|
    amount: number,
    rank: number,
|};

export type TeamSeason = {|
    tid: number,
    season: number,
    gp: number,
    gpHome: number,
    att: number,
    cash: number,
    won: number,
    lost: number,
    wonHome: number,
    lostHome: number,
    wonAway: number,
    lostAway: number,
    wonDiv: number,
    lostDiv: number,
    wonConf: number,
    lostConf: number,
    lastTen: (0 | 1)[],
    streak: number,
    playoffRoundsWon: number, // -1: didn't make playoffs. 0: lost in first round. ... N: won championship
    hype: number,
    pop: number,
    stadiumCapacity: number,
    revenues: {|
        luxuryTaxShare: BudgetItem,
        merch: BudgetItem,
        sponsor: BudgetItem,
        ticket: BudgetItem,
        nationalTv: BudgetItem,
        localTv: BudgetItem,
    |},
    expenses: {|
        salary: BudgetItem,
        luxuryTax: BudgetItem,
        minTax: BudgetItem,
        scouting: BudgetItem,
        coaching: BudgetItem,
        health: BudgetItem,
        facilities: BudgetItem,
    |},
    payrollEndOfSeason: number,
|};

// opp stats (except Blk) can be undefined
export type TeamStats = any;

export type OverridesCore = {|
    season: {
        newSchedule?: (teams: Team[]) => [number, number][],
    },
|};

export type TradePickValues = {
    [key: string]: number[],
};

type TradeSummaryTeam = {|
    name: string,
    payrollAfterTrade: number,
    picks: {|
        dpid: number,
        desc: string,
    |}[],
    total: number,
    trade: PlayerFiltered[],
|};

export type TradeSummary = {|
    teams: [TradeSummaryTeam, TradeSummaryTeam],
    warning: null | string,
|};

type TradeTeam = {|
    dpids: number[],
    dpidsExcluded: number[],
    pids: number[],
    pidsExcluded: number[],
    tid: number,
|};

export type TradeTeams = [TradeTeam, TradeTeam];

export type Trade = {|
    rid: 0,
    teams: TradeTeams,
|};

export type UpdateEvents = (
    | "account"
    | "firstRun"
    | "g.userTids"
    | "gameAttributes"
    | "gameSim"
    | "lock.gameSim"
    | "newPhase"
    | "playerMovement"
    | "watchList"
)[];

export type RunFunction = (
    inputs: GetOutput,
    updateEvents: UpdateEvents,
    state: any,
    setState: (state: any) => void,
) => Promise<void | { [key: string]: any }>;
