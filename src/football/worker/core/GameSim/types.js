import type { Position } from "../../../common/types";

export type PlayType =
    | "kickoff"
    | "kickoffReturn"
    | "punt"
    | "puntReturn"
    | "passIncomplete"
    | "passComplete"
    | "run"
    | "fumbleRecoverOffense"
    | "fumbleRecoverDefense"
    | "interception"
    | "safety"
    | "sack"
    | "penalty"
    | "twoMinuteWarning"
    | "overtime"
    | "quarter"
    | "touchdown";

export type ShotType = "atRim" | "ft" | "lowPost" | "midRange" | "threePointer";

export type Stat =
    | "ast"
    | "ba"
    | "benchTime"
    | "blk"
    | "courtTime"
    | "drb"
    | "energy"
    | "fg"
    | "fgAtRim"
    | "fgLowPost"
    | "fgMidRange"
    | "fga"
    | "fgaAtRim"
    | "fgaLowPost"
    | "fgaMidRange"
    | "ft"
    | "fta"
    | "gs"
    | "min"
    | "orb"
    | "pf"
    | "pts"
    | "stl"
    | "tov"
    | "tp"
    | "tpa";

export type PlayerNumOnCourt = 0 | 1 | 2 | 3 | 4;

export type TeamNum = 0 | 1;

export type CompositeRating =
    | "blocking"
    | "fouling"
    | "passing"
    | "rebounding"
    | "stealing"
    | "turnovers"
    | "usage";

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
