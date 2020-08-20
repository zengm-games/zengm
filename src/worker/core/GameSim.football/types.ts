import type { Position } from "../../../common/types.football";

export type PlayType =
	| "quarter"
	| "overtime"
	| "gameOver"
	| "injury"
	| "kickoff"
	| "kickoffReturn"
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
	id: number;
	name: string;
	age: number;
	pos: string;
	valueNoPot: number;
	stat: any;
	compositeRating: any;
	skills: string[];
	injured: boolean;
	ptModifier: number;
	ovrs: Record<Position, number>;
};

export type PlayersOnField = Partial<Record<Position, PlayerGameSim[]>>;

export type TeamGameSim = {
	id: number;
	pace: number;
	// mean number of possessions the team likes to have in a game
	stat: any;
	player: PlayerGameSim[];
	compositeRating: any;
	depth: Record<Position, PlayerGameSim[]>;
};

export type Formation = {
	off: Partial<Record<Position, number>>;
	def: Partial<Record<Position, number>>;
};
