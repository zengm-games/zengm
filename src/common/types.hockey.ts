import type teamStats from "../worker/core/team/stats.hockey";

// Should all the extra ones be in teamStats["derived"]?
export type TeamStatAttr =
	| typeof teamStats["raw"][number]
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

type AwardTeam = {
	tid: number;
	abbrev: string;
	region: string;
	name: string;
	won: number;
	lost: number;
	tied: number | undefined;
	otl: number | undefined;
};

export type AwardPlayer = {
	pid: number;
	name: string;
	tid: number;
	pos: string;
	g: number;
	a: number;
	pts: number;
	ops: number;
	tk: number;
	hit: number;
	dps: number;
	gaa: number;
	svPct: number;
	gps: number;
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
	mvp: AwardPlayer | undefined;
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
	dpoy: AwardPlayer;
	dfoy: AwardPlayer;
	goy: AwardPlayer;
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
