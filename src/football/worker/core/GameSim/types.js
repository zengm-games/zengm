import type { Position } from "../../../common/types";

export type PlayType =
    | "quarter"
    | "overtime"
    | "gameOver"
    | "injury"
    | "kickoff"
    | "kickoffReutrn"
    | "punt"
    | "puntReturn"
    | "extraPoint"
    | "fieldGoal"
    | "fumble"
    | "fumbleRecovery"
    | "interception"
    | "sack"
    | "dropback"
    | "passComplete"
    | "passIncomplete"
    | "handoff"
    | "run"
    | "onsideKick"
    | "onsideKickRecovery"
    | "offsettingPenalties"
    | "penalty"
    | "timeout"
    | "twoMinuteWarning";

export type TeamNum = 0 | 1;

export type CompositeRating =
    | "passingAccuracy"
    | "passingDeep"
    | "passingVision"
    | "athleticism"
    | "rushing"
    | "catching"
    | "gettingOpen"
    | "passBlocking"
    | "runBlocking"
    | "passRushing"
    | "runStopping"
    | "passCoverage"
    | "tackling"
    | "avoidingSacks"
    | "ballSecurity"
    | "endurance";

export type PenaltyPlayType =
    | "beforeSnap"
    | "kickoffReturn"
    | "fieldGoal"
    | "punt"
    | "puntReturn"
    | "pass"
    | "run";

export type PlayerGameSim = {
    id: number,
    name: string,
    pos: string,
    valueNoPot: number,
    stat: Object,
    compositeRating: Object,
    skills: string[],
    injured: boolean,
    ptModifier: number,
};

export type PlayersOnField = [
    { [key: Position]: PlayerGameSim },
    { [key: Position]: PlayerGameSim },
];

export type TeamGameSim = {
    id: number,
    pace: number, // mean number of possessions the team likes to have in a game
    stat: Object,
    compositeRating: Object,
    player: PlayerGameSim[],
    compositeRating: Object,
    depth: {
        [key: Position]: number[],
    },
};
