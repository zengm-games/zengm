import type { Conf, Div } from "../../../common/types";

export type NewLeagueTeam = {
	tid: number;
	region: string;
	name: string;
	abbrev: string;
	pop: number;
	popRank: number;
	stadiumCapacity?: number;
	imgURL?: string;
	imgURLSmall?: string;
	colors?: [string, string, string];
	srID?: string;
	disabled?: boolean;
	jersey?: string;
	cid: number;
	did: number;
};

export type LeagueInfo = {
	startingSeason: number;
	stores: string[];
	gameAttributes: Record<string, unknown> & {
		confs: Conf[];
		divs: Div[];
	};
	teams: NewLeagueTeam[];
};
