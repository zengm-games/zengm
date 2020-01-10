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
	pos: string;
	keyStats: string;
};
export type Awards = {
	season: number;
	bestRecord: AwardTeam;
	bestRecordConfs: AwardTeam[];
	oroy: AwardPlayer | undefined;
	droy: AwardPlayer | undefined;
	allRookie: (AwardPlayer | undefined)[];
	mvp: AwardPlayer | undefined;
	dpoy: AwardPlayer | undefined;
	allLeague: [
		{
			title: "First Team";
			players: (AwardPlayer | undefined)[];
		},
		{
			title: "Second Team";
			players: (AwardPlayer | undefined)[];
		},
	];
	finalsMvp: AwardPlayer | undefined;
};
export type Position =
	| "QB"
	| "RB"
	| "WR"
	| "TE"
	| "OL"
	| "DL"
	| "LB"
	| "CB"
	| "S"
	| "K"
	| "P"
	| "KR"
	| "PR";
export type PlayerRatings = {
	hgt: number;
	stre: number;
	spd: number;
	endu: number;
	thv: number;
	thp: number;
	tha: number;
	bsc: number;
	elu: number;
	rtr: number;
	hnd: number;
	rbk: number;
	pbk: number;
	pcv: number;
	tck: number;
	prs: number;
	rns: number;
	kpw: number;
	kac: number;
	ppw: number;
	pac: number;
	fuzz: number;
	ovr: number;
	pot: number;
	ovrs: Record<Position, number>;
	pots: Record<Position, number>;
	pos: string;
	season: number;
	skills: string[];
	injuryIndex?: number;
};
export type RatingKey =
	| "hgt"
	| "stre"
	| "spd"
	| "endu"
	| "thv"
	| "thp"
	| "tha"
	| "bsc"
	| "elu"
	| "rtr"
	| "hnd"
	| "rbk"
	| "pbk"
	| "pcv"
	| "tck"
	| "prs"
	| "rns"
	| "kpw"
	| "kac"
	| "ppw"
	| "pac";
