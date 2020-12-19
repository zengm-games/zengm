export type NewLeagueTeam = {
	tid: number;
	region: string;
	name: string;
	pop?: number;
	popRank: number;
	srID?: string;
	disabled?: boolean;
	cid: number;
	did: number;
};

export type LeagueInfo = {
	startingSeason: number;
	stores: string[];
	teams: NewLeagueTeam[];
};
