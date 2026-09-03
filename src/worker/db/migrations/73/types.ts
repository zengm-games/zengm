type AwardTeam = {
	tid: number;
	abfv: string;
	region: string;
	name: string;
	won: number;
	lost: number;
	tied: number | undefined;
	otl: number | undefined;
};

export type OldAwardsBaseball<
	AwardPlayer = {
		pid: number;
		name: string;
		tid: number;
		pos: string;
		keyStats: string;
	},
> = {
	season: number;
	bestRecord: AwardTeam;

	// undefined gets turned into null by JSON.stringify
	bestRecordConfs: (AwardTeam | undefined | null)[];

	roy: AwardPlayer | undefined;
	allOffense: (AwardPlayer | undefined)[];
	allDefense: (AwardPlayer | undefined)[];
	allRookie: (AwardPlayer | undefined)[];
	mvp: AwardPlayer | undefined;
	poy: AwardPlayer | undefined;
	rpoy: AwardPlayer | undefined;
	finalsMvp: AwardPlayer | undefined;
};

export type OldAwardsBasketball<
	AwardPlayer = {
		pid: number;
		name: string;
		tid: number;
		pts: number;
		trb: number;
		ast: number;
	},
	AwardPlayerDefense = {
		pid: number;
		name: string;
		tid: number;
		trb: number;
		blk: number;
		stl: number;
	},
> = {
	season: number;
	bestRecord: AwardTeam;

	// undefined gets turned into null by JSON.stringify
	bestRecordConfs: (AwardTeam | undefined | null)[];

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
	dpoy: AwardPlayerDefense | undefined;
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
	sfmvp: AwardPlayer[] | undefined;
};

export type OldAwardsFootball<
	AwardPlayer = {
		pid: number;
		name: string;
		tid: number;
		pos: string;
		keyStats: string;
	},
> = {
	season: number;
	bestRecord: AwardTeam;

	// undefined gets turned into null by JSON.stringify
	bestRecordConfs: (AwardTeam | undefined | null)[];
	oroy: AwardPlayer | undefined;
	droy: AwardPlayer | undefined;
	allRookie: (AwardPlayer | undefined)[];
	mvp: AwardPlayer | undefined;
	opoy: AwardPlayer | undefined;
	poy: AwardPlayer | undefined;
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

export type OldAwardsHockey<
	AwardPlayer = {
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
	},
> = {
	season: number;
	bestRecord: AwardTeam;

	// undefined gets turned into null by JSON.stringify
	bestRecordConfs: (AwardTeam | undefined | null)[];

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
	dpoy: AwardPlayer | undefined;
	dfoy: AwardPlayer | undefined;
	goy: AwardPlayer | undefined;
	finalsMvp: AwardPlayer | undefined;
};

export type OldAwards =
	| OldAwardsBaseball
	| OldAwardsBasketball
	| OldAwardsFootball
	| OldAwardsHockey;
