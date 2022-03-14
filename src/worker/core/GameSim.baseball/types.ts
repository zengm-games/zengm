import type { PlayerInjury } from "../../../common/types";
import type { Position } from "../../../common/types.baseball";

export type TeamNum = 0 | 1;

export type CompositeRating = "";

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
	newInjury: boolean;
	injury: PlayerInjury & {
		playingThrough: boolean;
	};
	ptModifier: number;
	ovrs: Record<Position, number>;
	lineupPos: string;
};

export type TeamGameSim = {
	id: number;
	stat: any;
	player: PlayerGameSim[];
	compositeRating: any;
	depth: Record<"L" | "LP" | "D" | "DP" | "P", PlayerGameSim[]>;
	synergy: {
		reb: number;
	};
};
