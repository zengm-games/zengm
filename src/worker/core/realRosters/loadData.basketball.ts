import type { Phase, ScheduledEventWithoutKey } from "../../../common/types";

export type Ratings = {
	slug: string;
	season: number;
	hgt: number;
	stre: number;
	spd: number;
	jmp: number;
	endu: number;
	ins: number;
	dnk: number;
	ft: number;
	fg: number;
	tp: number;
	diq: number;
	oiq: number;
	drb: number;
	pss: number;
	reb: number;
	abbrev_if_new_row?: string;
};

export type Basketball = {
	awards: Record<
		string,
		| {
				type: string;
				season: number;
		  }[]
		| undefined
	>;
	teams: {
		slug: string;
		season: number;
		abbrev: string;
		jerseyNumber?: string;

		// Currently, phase is only set for players in the alexnoob rosters who move between phases in the same year. So currently I have those for PRESEASON and DRAFT_LOTTERY, meaning it can't identify players who joined a team during the season but before the playoffs. Well, handles the 2021 Horford trade at least.
		phase?: number;
	}[];
	bios: Record<
		string,
		| {
				name: string;
				bornYear: number;
				diedYear: number;
				country: string;
				weight: number;
				pos: string;
				height: number;
				college: string;
				draftYear: number;
				draftRound: number;
				draftPick: number;
				draftAbbrev: string;
		  }
		| undefined
	>;
	ratings: Ratings[];
	relatives: {
		type: "son" | "brother" | "father";
		slug: string;
		slug2: string;
	}[];
	salaries: {
		slug: string;
		start: number;
		exp: number;
		amount: number;
	}[];
	injuries: Record<
		string,
		| {
				season: number;
				phase: Phase;
				type: string;
				gamesRemaining: number;
		  }[]
		| undefined
	>;
	scheduledEventsGameAttributes: ScheduledEventWithoutKey[];
	scheduledEventsTeams: ScheduledEventWithoutKey[];
	draftPicks: Record<
		number,
		{
			abbrev: string;
			round: number;
			pick?: number;

			// Would be nice to have all these, but we don't, so just assume it's same as abbrev then
			originalAbbrev?: string;

			// If a player was drafted with this pick
			slug?: string;

			// Only for the hardcoded current season picks
			season?: number;

			// Records when picks have been traded
			range?:
				| [[number, number], [number, number]]
				| [[number, number], null]
				| [null, [number, number]];
		}[]
	>;
	freeAgents: any[];
	teamSeasons: Record<
		number,
		Record<
			string,
			{
				abbrev: string;
				won: number;
				lost: number;
				wonHome: number;
				lostHome: number;
				wonAway: number;
				lostAway: number;
				wonDiv: number;
				lostDiv: number;
				wonConf: number;
				lostConf: number;
			}
		>
	>;
	playoffSeries: Record<
		number,
		{
			round: number;
			abbrevs: [string, string];
			seeds: [number, number];
			wons: [number, number];
		}[]
	>;
	expansionDrafts: Record<number, Record<string, string[]>>;
	retiredJerseyNumbers: Record<
		string,
		{
			number: string;
			season: number;
			slug: string;
		}[]
	>;
};

let cachedJSON: Basketball;
const loadData = async () => {
	if (cachedJSON) {
		return cachedJSON;
	}
	const response = await fetch("/gen/real-player-data.json");
	cachedJSON = await response.json();
	return cachedJSON;
};

export default loadData;
