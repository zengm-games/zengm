import type { Conf, Div, Player } from "../../../common/types";

// Keep in sync with BASIC_TEAM_KEYS
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
	players?: Player[];
	usePlayers?: boolean;
};

export type NewLeagueTeamWithoutRank = Omit<NewLeagueTeam, "popRank">;

export type LeagueInfo = {
	startingSeason: number;
	stores: string[];
	gameAttributes: Record<string, unknown> & {
		confs: Conf[];
		divs: Div[];
	};
	teams: NewLeagueTeamWithoutRank[];
};
