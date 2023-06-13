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
	season: number = g.get("season"),
	defaultStadiumCapacity: number = g.get("defaultStadiumCapacity"),
) => {
	const newSeason: TeamSeasonWithoutKey = {
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
			luxuryTaxShare: 0,
			merch: 0,
			sponsor: 0,
			ticket: 0,
			nationalTv: 0,
			localTv: 0,
		},
		expenses: {
			salary: 0,
			luxuryTax: 0,
			minTax: 0,
			scouting: 0,
			coaching: 0,
			health: 0,
			facilities: 0,
		},
		expenseLevels: {
			scouting: 0,
			coaching: 0,
			health: 0,
			facilities: 0,
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
		newSeason.imgURLSmall = t.imgURLSmall;
	}

	// @ts-expect-error
	if (typeof t.stadiumCapacity === "number") {
		// @ts-expect-error
		newSeason.stadiumCapacity = t.stadiumCapacity;
	}

	if (prevSeason) {
		// New season, carrying over some values from the previous season
		newSeason.hype = prevSeason.hype;
		newSeason.cash = prevSeason.cash;
		if (t.pop === undefined) {
			newSeason.pop = prevSeason.pop;
		}
		// @ts-expect-error
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
