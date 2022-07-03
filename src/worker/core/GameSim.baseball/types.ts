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
	pFatigue: number;
	seasonStats: Record<string, number>;

	// Used for box score ordering only
	battingOrder?: number;
	subIndex?: number;
};

export type TeamGameSim = {
	id: number;
	cid: number;
	stat: any;
	player: PlayerGameSim[];
	compositeRating: any;
	depth: Record<"L" | "LP" | "D" | "DP" | "P", PlayerGameSim[]>;
	synergy: {
		reb: number;
	};
};

export type Runner = {
	pid: number;
	from: 1 | 2 | 3; // 1st/2nd/3rd base
	to: 2 | 3 | 4; // 2nd/3rd/home
	out: boolean;
	scored?: boolean; // Handles case where to is 4 but the 3rd out occurred, like a fielder's choice
};
