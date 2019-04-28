// @flow

type AwardTeam = {|
    tid: number,
    abbrev: string,
    region: string,
    name: string,
    won: number,
    lost: number,
    tied: number | void,
|};

export type AwardPlayer = {|
    pid: number,
    pos: string,
    name: string,
    tid: number,
    abbrev: string,
    pos: string,
    keyStats: string,
|};

export type Awards = {|
    season: number,
    bestRecord: AwardTeam,
    bestRecordConfs: AwardTeam[],

    oroy: AwardPlayer | void,
    droy: AwardPlayer | void,
    allRookie: (AwardPlayer | void)[],
    mvp: AwardPlayer | void,
    dpoy: AwardPlayer | void,
    allLeague: [
        {
            title: "First Team",
            players: (AwardPlayer | void)[],
        },
        {
            title: "Second Team",
            players: (AwardPlayer | void)[],
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
    tck: number,
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
    | "tck"
    | "prs"
    | "rns"
    | "kpw"
    | "kac"
    | "ppw"
    | "pac";
