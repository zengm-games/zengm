import { g } from "../../util";
import type {
	Team,
	TeamBasic,
	TeamSeasonWithoutKey,
} from "../../../common/types";
import { DEFAULT_JERSEY } from "../../../common";

const genSeasonRow = (
	t: Team | TeamBasic,
	prevSeason?: TeamSeasonWithoutKey,
	numActiveTeams: number = g.get("numActiveTeams"),
	season: number = g.get("season"),
	defaultStadiumCapacity: number = g.get("defaultStadiumCapacity"),
): TeamSeasonWithoutKey => {
	const defaultRank = (numActiveTeams + 1) / 2;
	const newSeason = {
		tid: t.tid,
		cid: t.cid,
		did: t.did,
		region: t.region,
		name: t.name,
		abbrev: t.abbrev,
		imgURL: t.imgURL,
		colors: t.colors,
		jersey: t.jersey ?? DEFAULT_JERSEY,
		season,
		gp: 0,
		gpHome: 0,
		att: 0,
		cash: 10000,
		won: 0,
		lost: 0,
		tied: 0,
		otl: 0,
		wonHome: 0,
		lostHome: 0,
		tiedHome: 0,
		otlHome: 0,
		wonAway: 0,
		lostAway: 0,
		tiedAway: 0,
		otlAway: 0,
		wonDiv: 0,
		lostDiv: 0,
		tiedDiv: 0,
		otlDiv: 0,
		wonConf: 0,
		lostConf: 0,
		tiedConf: 0,
		otlConf: 0,
		lastTen: [],
		streak: 0,
		playoffRoundsWon: -1, // -1: didn't make playoffs. 0: lost in first round. ... N: won championship
		hype: Math.random(),
		pop: 1,
		stadiumCapacity: defaultStadiumCapacity,
		revenues: {
			luxuryTaxShare: {
				amount: 0,
				rank: defaultRank,
			},
			merch: {
				amount: 0,
				rank: defaultRank,
			},
			sponsor: {
				amount: 0,
				rank: defaultRank,
			},
			ticket: {
				amount: 0,
				rank: defaultRank,
			},
			nationalTv: {
				amount: 0,
				rank: defaultRank,
			},
			localTv: {
				amount: 0,
				rank: defaultRank,
			},
		},
		expenses: {
			salary: {
				amount: 0,
				rank: defaultRank,
			},
			luxuryTax: {
				amount: 0,
				rank: defaultRank,
			},
			minTax: {
				amount: 0,
				rank: defaultRank,
			},
			scouting: {
				amount: 0,
				rank: defaultRank,
			},
			coaching: {
				amount: 0,
				rank: defaultRank,
			},
			health: {
				amount: 0,
				rank: defaultRank,
			},
			facilities: {
				amount: 0,
				rank: defaultRank,
			},
		},
		payrollEndOfSeason: -1,
		ownerMood: {
			wins: 0,
			playoffs: 0,
			money: 0,
		},
		numPlayersTradedAway: 0,
	};

	if (typeof t.pop === "number") {
		newSeason.pop = t.pop;
	}

	if (typeof t.imgURLSmall === "string") {
		// @ts-ignore
		newSeason.imgURLSmall = t.imgURLSmall;
	}

	// @ts-ignore
	if (typeof t.stadiumCapacity === "number") {
		// @ts-ignore
		newSeason.stadiumCapacity = t.stadiumCapacity;
	}

	if (prevSeason) {
		// New season, carrying over some values from the previous season
		newSeason.hype = prevSeason.hype;
		newSeason.cash = prevSeason.cash;
		if (t.pop === undefined) {
			newSeason.pop = prevSeason.pop;
		}
		// @ts-ignore
		if (t.stadiumCapacity === undefined) {
			newSeason.stadiumCapacity = prevSeason.stadiumCapacity;
		}

		if (g.get("userTid") === t.tid) {
			if (prevSeason.ownerMood) {
				newSeason.ownerMood = prevSeason.ownerMood;
			} else if ((g as any).ownerMood) {
				newSeason.ownerMood = (g as any).ownerMood;
			}
		}
	}

	return newSeason;
};

export default genSeasonRow;
