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

export type PlayerRatings = {|
    diq: number,
    dnk: number,
    drb: number,
    endu: number,
    fg: number,
    ft: number,
    fuzz: number,
    hgt: number,
    ins: number,
    jmp: number,
    oiq: number,
    ovr: number,
    pos: string,
    pot: number,
    pss: number,
    reb: number,
    season: number,
    spd: number,
    skills: string[],
    stre: number,
    tp: number,
|};

export type RatingKey =
    | "diq"
    | "dnk"
    | "drb"
    | "endu"
    | "fg"
    | "ft"
    | "hgt"
    | "ins"
    | "jmp"
    | "oiq"
    | "pss"
    | "reb"
    | "spd"
    | "stre"
    | "tp";
