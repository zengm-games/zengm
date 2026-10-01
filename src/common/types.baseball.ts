import type teamStats from "../worker/core/team/stats.baseball.ts";
import type playerStats from "../worker/core/player/stats.baseball.ts";
import type { statFunctions as playerStatFunctions } from "./processPlayerStats.baseball.ts";
import type { PlayerStatMax } from "./types.ts";

// Should all the extra ones be in teamStats["derived"]?
export type TeamStatAttr =
	| (typeof teamStats)["raw"][number]
	| "ab"
	| "ba"
	| "ops"
	| "era"
	| "po"
	| "poSo"
	| "poTot"
	| "obp"
	| "slg"
	| "tb"
	| "ip"
	| "winp"
	| "fip"
	| "whip"
	| "h9"
	| "hr9"
	| "bb9"
	| "so9"
	| "pc9"
	| "sow"
	| "rfldTot"
	| "csp"
	| "oppAb"
	| "oppBa"
	| "oppObp"
	| "oppSlg"
	| "oppOps"
	| "oppTb"
	| "oppEra"
	| "oppIp"
	| "oppFip"
	| "oppWhip"
	| "oppH9"
	| "oppHr9"
	| "oppBb9"
	| "oppSo9"
	| "oppPc9"
	| "oppSow"
	| "oppCsp";

export type TeamStatAttrByPos =
	| (typeof teamStats)["byPos"][number]
	| "ch"
	| "fldp"
	| "rf9"
	| "rfg"
	| "inn"
	| "oppCh"
	| "oppFldp"
	| "oppRf9"
	| "oppRfg"
	| "oppInn";

type PlayerStatAttrString = "keyStats" | "keyStatsShort";

// Arrays indexed by position, like byPos
type PlayerStatAttrByPosDerived =
	| "rfld"
	| "ch"
	| "fldp"
	| "rf9"
	| "rfg"
	| "inn";

// Stats row as stored in the database, in p.stats. rfld is an array like byPos
export type PlayerStats = Record<
	Exclude<
		| (typeof playerStats)["raw"][number]
		| (typeof playerStats)["derived"][number],
		"rfld"
	>,
	number
> &
	Record<
		(typeof playerStats)["byPos"][number] | "rfld",
		(number | undefined)[]
	> &
	Record<(typeof playerStats)["max"][number], PlayerStatMax>;

export type PlayerStatsPlus = Record<
	Exclude<
		| (typeof playerStats)["raw"][number]
		| (typeof playerStats)["derived"][number]
		| keyof typeof playerStatFunctions,
		PlayerStatAttrString | PlayerStatAttrByPosDerived
	>,
	number
> &
	Record<PlayerStatAttrString, string> &
	Record<
		(typeof playerStats)["byPos"][number] | PlayerStatAttrByPosDerived,
		(number | undefined)[]
	> &
	Record<(typeof playerStats)["max"][number], PlayerStatMax>;

export type Position =
	| "SP"
	| "RP"
	| "C"
	| "1B"
	| "2B"
	| "3B"
	| "SS"
	| "LF"
	| "CF"
	| "RF"
	| "DH";

export type PlayerRatings = {
	hgt: number;
	spd: number;
	hpw: number;
	con: number;
	eye: number;
	gnd: number;
	fly: number;
	thr: number;
	cat: number;
	ppw: number;
	ctl: number;
	mov: number;
	endu: number;
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
	| "spd"
	| "hpw"
	| "con"
	| "eye"
	| "gnd"
	| "fly"
	| "thr"
	| "cat"
	| "ppw"
	| "ctl"
	| "mov"
	| "endu";
