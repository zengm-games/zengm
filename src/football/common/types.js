// @flow

type AwardTeam = {|
    tid: number,
    abbrev: string,
    region: string,
    name: string,
    won: number,
    lost: number,
|};

export type AwardPlayer = {|
    pid: number,
    name: string,
    tid: number,
    abbrev: string,
    pts: number,
    trb: number,
    ast: number,
|};

export type AwardPlayerDefense = {|
    pid: number,
    name: string,
    tid: number,
    abbrev: string,
    trb: number,
    blk: number,
    stl: number,
|};

export type Awards = {|
    season: number,
    bestRecord: AwardTeam,
    bestRecordConfs: AwardTeam[],

    // Only in old leagues
    bre?: AwardTeam,
    brw?: AwardTeam,

    roy: AwardPlayer | void,
    allRookie: AwardPlayer[], // If there are <5 rookies in a league file
    mip: AwardPlayer | void, // First season has no MIP
    mvp: AwardPlayer,
    smoy: AwardPlayer | void, // Some weird leagues could have only starters
    allLeague: [
        {
            title: "First Team",
            players: [
                AwardPlayer,
                AwardPlayer,
                AwardPlayer,
                AwardPlayer,
                AwardPlayer,
            ],
        },
        {
            title: "Second Team",
            players: [
                AwardPlayer,
                AwardPlayer,
                AwardPlayer,
                AwardPlayer,
                AwardPlayer,
            ],
        },
        {
            title: "Third Team",
            players: [
                AwardPlayer,
                AwardPlayer,
                AwardPlayer,
                AwardPlayer,
                AwardPlayer,
            ],
        },
    ],
    dpoy: AwardPlayerDefense,
    allDefensive: [
        {
            title: "First Team",
            players: [
                AwardPlayerDefense,
                AwardPlayerDefense,
                AwardPlayerDefense,
                AwardPlayerDefense,
                AwardPlayerDefense,
            ],
        },
        {
            title: "Second Team",
            players: [
                AwardPlayerDefense,
                AwardPlayerDefense,
                AwardPlayerDefense,
                AwardPlayerDefense,
                AwardPlayerDefense,
            ],
        },
        {
            title: "Third Team",
            players: [
                AwardPlayerDefense,
                AwardPlayerDefense,
                AwardPlayerDefense,
                AwardPlayerDefense,
                AwardPlayerDefense,
            ],
        },
    ],
    finalsMvp: AwardPlayer | void,
|};

export type Position =
    | "QB"
    | "RB"
    | "WR"
    | "TE"
    | "OL"
    | "DL"
    | "LB"
    | "CB"
    | "S"
    | "K"
    | "P"
    | "KR"
    | "PR";

export type PlayerRatings = {|
    hgt: number,
    stre: number,
    spd: number,
    endu: number,
    thv: number,
    thp: number,
    tha: number,
    bsc: number,
    elu: number,
    rtr: number,
    hnd: number,
    rbk: number,
    pbk: number,
    pcv: number,
    prs: number,
    rns: number,
    kpw: number,
    kac: number,
    ppw: number,
    pac: number,
    fuzz: number,
    ovr: number,
    pot: number,
    ovrs: {
        [key: Position]: number,
    },
    pots: {
        [key: Position]: number,
    },
    pos: string,
    season: number,
    skills: string[],
|};

export type RatingKey =
    | "hgt"
    | "stre"
    | "spd"
    | "endu"
    | "thv"
    | "thp"
    | "tha"
    | "bsc"
    | "elu"
    | "rtr"
    | "hnd"
    | "rbk"
    | "pbk"
    | "pcv"
    | "prs"
    | "rns"
    | "kpw"
    | "kac"
    | "ppw"
    | "pac";
