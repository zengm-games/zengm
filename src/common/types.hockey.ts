import type teamStats from "../worker/core/team/stats.basketball";

// Should all the extra ones be in teamStats["derived"]?
export type TeamStatAttr =
	| typeof teamStats["raw"][number]
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
	| "trb"
	| "oppTrb"
	| "2p"
	| "2pa"
	| "2pp"
	| "opp2p"
	| "opp2pa"
	| "opp2pp";

type AwardTeam = {
	tid: number;
	abbrev: string;
	region: string;
	name: string;
	won: number;
	lost: number;
	tied: number | undefined;
};

export type AwardPlayer = {
	pid: number;
	name: string;
	tid: number;
	abbrev: string;
	pts: number;
	trb: number;
	ast: number;
};

export type AwardPlayerDefense = {
	pid: number;
	name: string;
	tid: number;
	abbrev: string;
	trb: number;
	blk: number;
	stl: number;
};

export type Awards = {
	season: number;
	bestRecord: AwardTeam;
	bestRecordConfs: (AwardTeam | undefined)[];

	// Only in old leagues
	bre?: AwardTeam;
	brw?: AwardTeam;

	roy: AwardPlayer | undefined;
	allRookie: AwardPlayer[];
	mip: AwardPlayer | undefined;
	mvp: AwardPlayer | undefined;
	smoy: AwardPlayer | undefined;
	allLeague: [
		{
			title: "First Team";
			players: AwardPlayer[];
		},
		{
			title: "Second Team";
			players: AwardPlayer[];
		},
		{
			title: "Third Team";
			players: AwardPlayer[];
		},
	];
	dpoy: AwardPlayerDefense;
	allDefensive: [
		{
			title: "First Team";
			players: AwardPlayerDefense[];
		},
		{
			title: "Second Team";
			players: AwardPlayerDefense[];
		},
		{
			title: "Third Team";
			players: AwardPlayerDefense[];
		},
	];
	finalsMvp: AwardPlayer | undefined;
};

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
