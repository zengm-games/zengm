import type teamStats from "../worker/core/team/stats.basketball.ts";

// Should all the extra ones be in teamStats["derived"]?
export type TeamStatAttr =
	| (typeof teamStats)["raw"][number]
	| "fgp"
	| "oppFgp"
	| "fgpAtRim"
	| "oppFgpAtRim"
	| "fgpLowPost"
	| "oppFgpLowPost"
	| "fgpMidRange"
	| "oppFgpMidRange"
	| "tpp"
	| "oppTpp"
	| "ftp"
	| "oppFtp"
	| "mov"
	| "oppMov"
	| "pw"
	| "pl"
	| "ortg"
	| "drtg"
	| "nrtg"
	| "pace"
	| "poss"
	| "tpar"
	| "ftr"
	| "tsp"
	| "efg"
	| "tovp"
	| "orbp"
	| "ftpFga"
	| "trb"
	| "oppTrb"
	| "2p"
	| "2pa"
	| "2pp"
	| "opp2p"
	| "opp2pa"
	| "opp2pp"
	| "oppEfg"
	| "oppTovp"
	| "drbp"
	| "oppFtpFga";

export type PlayerRatings = {
	diq: number;
	dnk: number;
	drb: number;
	endu: number;
	fg: number;
	ft: number;
	fuzz: number;
	hgt: number;
	injuryIndex?: number;
	ins: number;
	jmp: number;
	locked?: boolean;
	oiq: number;
	ovr: number;
	pos: string;
	pot: number;
	pss: number;
	reb: number;
	season: number;
	spd: number;
	skills: string[];
	stre: number;
	tp: number;
};

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
