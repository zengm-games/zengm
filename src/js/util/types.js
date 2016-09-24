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

export type TeamSeason = any;
