import type teamStats from "../worker/core/team/stats.hockey.ts";
import type playerStats from "../worker/core/player/stats.hockey.ts";
import type { statFunctions as playerStatFunctions } from "./processPlayerStats.hockey.ts";
import type { PlayerStatMax } from "./types.ts";

// Should all the extra ones be in teamStats["derived"]?
export type TeamStatAttr =
	| (typeof teamStats)["raw"][number]
	| "g"
	| "a"
	| "sa"
	| "sPct"
	| "svPct"
	| "foPct"
	| "ppPct"
	| "gaa"
	| "oppG"
	| "oppA"
	| "oppAa"
	| "oppSPct"
	| "oppSvPct"
	| "oppFoPct"
	| "oppPpPct"
	| "oppGaa";

type PlayerStatAttrString = "keyStats" | "keyStatsWithGoalieGP" | "gRec";

// Stats row as stored in the database, in p.stats
export type PlayerStats = Record<
	(typeof playerStats)["raw"][number] | (typeof playerStats)["derived"][number],
	number
> &
	Record<(typeof playerStats)["max"][number], PlayerStatMax>;

export type PlayerStatsPlus = Record<
	Exclude<
		| (typeof playerStats)["raw"][number]
		| (typeof playerStats)["derived"][number]
		| keyof typeof playerStatFunctions,
		PlayerStatAttrString
	>,
	number
> &
	Record<PlayerStatAttrString, string> &
	Record<(typeof playerStats)["max"][number], PlayerStatMax>;

export type Position = "C" | "W" | "D" | "G";

export type PlayerRatings = {
	hgt: number;
	stre: number;
	spd: number;
	endu: number;
	pss: number;
	wst: number;
	sst: number;
	stk: number;
	oiq: number;
	chk: number;
	blk: number;
	fcf: number;
	diq: number;
	glk: number;
	fuzz: number;
	injuryIndex?: number;
	locked?: boolean;
	ovr: number;
	pot: number;
	ovrs: Record<Position, number>;
	pots: Record<Position, number>;
	pos: string;
	season: number;
	skills: string[];
};

export type RatingKey =
	| "hgt"
	| "stre"
	| "spd"
	| "endu"
	| "pss"
	| "wst"
	| "sst"
	| "stk"
	| "oiq"
	| "chk"
	| "blk"
	| "fcf"
	| "diq"
	| "glk";
