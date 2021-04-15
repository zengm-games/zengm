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
	| "opp2pp";

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
	pts: number;
	trb: number;
	ast: number;
};

export type AwardPlayerDefense = {
	pid: number;
	name: string;
	tid: number;
	trb: number;
	blk: number;
	stl: number;
};

export type Awards<
	PlayerOverride = AwardPlayer,
	PlayerDefenseOverride = AwardPlayerDefense
> = {
	season: number;
	bestRecord: AwardTeam;
	bestRecordConfs: (AwardTeam | undefined)[];

	// Only in old leagues
	bre?: AwardTeam;
	brw?: AwardTeam;

	roy: PlayerOverride | undefined;
	allRookie: PlayerOverride[];
	mip: PlayerOverride | undefined;
	mvp: PlayerOverride | undefined;
	smoy: PlayerOverride | undefined;
	allLeague: [
		{
			title: "First Team";
			players: PlayerOverride[];
		},
		{
			title: "Second Team";
			players: PlayerOverride[];
		},
		{
			title: "Third Team";
			players: PlayerOverride[];
		},
	];
	dpoy: PlayerDefenseOverride | undefined;
	allDefensive: [
		{
			title: "First Team";
			players: PlayerDefenseOverride[];
		},
		{
			title: "Second Team";
			players: PlayerDefenseOverride[];
		},
		{
			title: "Third Team";
			players: PlayerDefenseOverride[];
		},
	];
	finalsMvp: PlayerOverride | undefined;
};

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
