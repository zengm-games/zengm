import type { ScheduledEventWithoutKey } from "../../../common/types";

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

// Not sure why this is necessary, TypeScript should figure it out automatically
type Basketball = {
	awards: Record<
		string,
		{
			type: string;
			season: number;
		}[]
	>;
	stats: {
		slug: string;
		season: number;
		abbrev: string;
	}[];
	bios: Record<
		string,
		{
			name: string;
			bornYear: number;
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
	injuries: {
		slug: string;
		season: number;
		type: string;
		gamesRemaining: number;
	}[];
	scheduledEventsGameAttributes: ScheduledEventWithoutKey[];
	scheduledEventsTeams: ScheduledEventWithoutKey[];
	draftPicks2020: {
		abbrev: string;
		originalAbbrev: string;
		round: number;
		pick: number;
		season: number;
	}[];
	freeAgents: any[];
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
