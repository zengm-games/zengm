// @flow

export type AchievementWhen =
    | "afterAwards"
    | "afterFired"
    | "afterPlayoffs"
    | "afterRegularSeason";

export type Achievement = {
    slug: string,
    name: string,
    category: string,
    desc: string,
    check?: () => Promise<boolean>,
    when?: AchievementWhen,
};

export type BackboardTx = any;

export type CompositeWeights<RatingKey = string> = {
    [key: string]: {
        ratings: (RatingKey | number)[],
        weights?: number[],
        skill?: {
            label: string,
            cutoff?: number,
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
    tied: number,
|}[];

export type DraftLotteryResult = {|
    season: number,
    draftType?: "nba1994" | "nba2019",
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
    scoringSummary?: any,
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
    | "defaultStadiumCapacity"
    | "disableInjuries"
    | "difficulty"
    | "divs"
    | "draftType"
    | "gameOver"
    | "godMode"
    | "godModeInPast"
    | "gracePeriodEnd"
    | "hardCap"
    | "homeCourtAdvantage"
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
    | "numDraftRounds"
    | "numGames"
    | "numGamesPlayoffSeries"
    | "numPlayoffByes"
    | "numPlayoffRounds" // Obsolete, just here for upgrade code
    | "numTeams"
    | "ownerMood"
    | "phase"
    | "playersRefuseToNegotiate"
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
    | "ties"
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
    result: "W" | "L" | "T",
    tid?: number,
    pts: number,
|};

export type GameProcessedCompleted = {|
    gid: number,
    overtime: string,
    result: "W" | "L" | "T",
    score: string,
    teams: [Object, Object],
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
    | "gameTied"
    | "gameWon"
    | "hallOfFame"
    | "healed"
    | "healedList"
    | "injured"
    | "injuredList"
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

export type Names = {|
    first: {
        [key: string]: [string, number][],
    },
    last: {
        [key: string]: [string, number][],
    },
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
export type PlayerStats = any;

export type RelativeType = "brother" | "father" | "son";

export type MinimalPlayerRatings = {
    ovr: number,
    pot: number,
    fuzz: number,
    pos: string,
    skills: string[],
    season: number,
    ovrs: any,
    pots: any,
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

export type PlayersPlusOptions = {
    season?: number,
    tid?: number,
    attrs?: string[],
    ratings?: string[],
    stats?: string[],
    playoffs?: boolean,
    regularSeason?: boolean,
    showNoStats?: boolean,
    showRookies?: boolean,
    showRetired?: boolean,
    fuzz?: boolean,
    oldStats?: boolean,
    numGamesRemaining?: number,
    statType?: PlayerStatType,
};

export type PlayerNames = {
    countries: [string, number][],
    first: {
        [key: string]: [string, number][],
    },
    last: {
        [key: string]: [string, number][],
    },
};

export type Local = {|
    autoPlaySeasons: number,
    fantasyDraftResults: Player<any>[],
    goldUntil: number,
    leagueLoaded: boolean,
    phaseText: string,
    playerNames: PlayerNames | void,
    playingUntilEndOfRound: boolean,
    statusText: string,
    unviewedSeasonSummary: boolean,

    reset?: () => void,
|};

export type PlayoffSeriesTeam = {|
    abbrev?: string,
    cid: number,
    imgURL?: string,
    pts?: number, // undefined means game hasn't happened yet
    region?: string,
    seed: number,
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
    pos: string,
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

export type SortType =
    | "currency"
    | "draftPick"
    | "lastTen"
    | "name"
    | "number"
    | "record";

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
    depth?: {
        QB: number[],
        RB: number[],
        WR: number[],
        TE: number[],
        OL: number[],
        DL: number[],
        LB: number[],
        CB: number[],
        S: number[],
        K: number[],
        P: number[],
        KR: number[],
        PR: number[],
    },
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
    tied: number,
    wonHome: number,
    lostHome: number,
    tiedHome: number,
    wonAway: number,
    lostAway: number,
    tiedAway: number,
    wonDiv: number,
    lostDiv: number,
    tiedDiv: number,
    wonConf: number,
    lostConf: number,
    tiedConf: number,
    lastTen: (-1 | 0 | 1)[],
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

export type WorkerOverridesConstants = {|
    COMPOSITE_WEIGHTS: CompositeWeights<>,
    PLAYER_STATS_TABLES: {
        [key: string]: {
            name: string,
            onlyShowIf?: string[],
            stats: string[],
        },
    },
    RATINGS: any[],
    POSITION_COUNTS: {
        [key: string]: number,
    },
    POSITIONS: any[],
    TEAM_STATS_TABLES: {
        [key: string]: {
            name: string,
            stats: string[],
        },
    },
    TIME_BETWEEN_GAMES: string,
|};

export type WorkerOverridesCore = {|
    GameSim: any,
    player: {
        checkStatisticalFeat?: (
            p: GamePlayer,
        ) => {
            [key: string]: number,
        } | void,
        developSeason?: (
            ratings: any,
            age: number,
            coachingRank?: number,
        ) => void,
        genRatings?: (season: number, scoutingRank: number) => any,
        genWeight?: (hgt: number, stre: number) => number,
        getDepthPlayers?: <
            // eslint-disable-next-line no-undef
            T: {
                pid: number,
            },
        >(
            depth: {
                QB: number[],
                RB: number[],
                WR: number[],
                TE: number[],
                OL: number[],
                DL: number[],
                LB: number[],
                CB: number[],
                S: number[],
                K: number[],
                P: number[],
                KR: number[],
                PR: number[],
            },
            players: T[], // eslint-disable-line no-undef
        ) => {
            QB: T[], // eslint-disable-line no-undef
            RB: T[], // eslint-disable-line no-undef
            WR: T[], // eslint-disable-line no-undef
            TE: T[], // eslint-disable-line no-undef
            OL: T[], // eslint-disable-line no-undef
            DL: T[], // eslint-disable-line no-undef
            LB: T[], // eslint-disable-line no-undef
            CB: T[], // eslint-disable-line no-undef
            S: T[], // eslint-disable-line no-undef
            K: T[], // eslint-disable-line no-undef
            P: T[], // eslint-disable-line no-undef
            KR: T[], // eslint-disable-line no-undef
            PR: T[], // eslint-disable-line no-undef
        },
        heightToRating?: (heightInInches: number) => number,
        madeHof?: (p: Player<> | PlayerWithoutPid<>) => boolean,
        ovr?: (any, pos?: string) => number,
        pos?: any => string,
        processStats?: (
            ps: PlayerStats,
            stats: string[],
            statType: PlayerStatType,
            bornYear: number,
        ) => any,
        stats?: {
            derived: string[],
            raw: string[],
        },
    },
    season: {
        doAwards?: (conditions: Conditions) => Promise<void>,
        newSchedule?: (teams: Team[]) => [number, number][],
    },
    team: {
        processStats?: (
            ts: TeamStats,
            stats: TeamStatAttr[],
            playoffs: boolean,
            statType: TeamStatType,
        ) => any,
        rosterAutoSort?: (
            tid: number,
            onlyNewPlayers?: boolean,
            pos?: any,
        ) => Promise<void>,
        stats?: {
            derived: string[],
            raw: string[],
        },
    },
|};

export type WorkerOverridesUtil = {|
    achievements: Achievement[],
    advStats: () => Promise<void>,
    changes: {|
        date: string,
        msg: string,
    |}[],
|};
