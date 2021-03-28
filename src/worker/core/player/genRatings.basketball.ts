import genFuzz from "./genFuzz";
import heightToRating from "./heightToRating";
import limitRating from "./limitRating";
import { helpers, random } from "../../util";
import type {
	PlayerRatings,
	RatingKey,
} from "../../../common/types.basketball";

const typeFactors: Record<
	"point" | "wing" | "big",
	Partial<Record<RatingKey, number>>
> = {
	point: {
		jmp: 1.2,
		spd: 1.1,
		drb: 1.2,
		pss: 1.2,
		reb: 0.8,
		ins: 0.9,
		ft: 1.2,
		fg: 1.2,
		tp: 1.2,
		endu: 1.1,
		dnk: 0.9,
	},
	wing: {
		jmp: 0.9,
		pss: 0.9,
		tp: 0.9,
	},
	big: {
		stre: 1.1,
		ins: 1.1,
		dnk: 1.1,
		endu: 0.9,
		reb: 1.1,
		spd: 0.9,
		jmp: 0.9,
		pss: 0.8,
		drb: 0.9,
		ft: 0.8,
		fg: 0.8,
		tp: 0.8,
	},
};

/**
 * Generate initial ratings for a newly-created player.
 *
 * @param {number} season [description]
 * @param {number} scoutingRank Between 1 and g.get("numActiveTeams") (default 30), the rank of scouting spending, probably over the past 3 years via core.finances.getRankLastThree.
 * @param {number} tid [description]
 * @return {Object} Ratings object
 */
const genRatings = (
	season: number,
	scoutingRank: number,
): {
	heightInInches: number;
	ratings: PlayerRatings;
} => {
	// realHeight is drawn from a custom probability distribution and then offset by a fraction of an inch either way
	let heightInInches = random.heightDist() + Math.random() - 0.5; // Fraction of an inch

	const wingspanAdjust = heightInInches + random.randInt(-1, 1); // hgt 0-100 corresponds to height 5'6" to 7'9" (Anything taller or shorter than the extremes will just get 100/0)

	const hgt = heightToRating(wingspanAdjust);
	heightInInches = Math.round(heightInInches); // Pick type of player (point, wing, or big) based on height

	const randType = Math.random();
	let type: keyof typeof typeFactors;

	if (hgt >= 59) {
		// 6'10" or taller
		if (randType < 0.01) {
			type = "point";
		} else if (randType < 0.05) {
			type = "wing";
		} else {
			type = "big";
		}
	} else if (hgt <= 33) {
		// 6'3" or shorter
		if (randType < 0.1) {
			type = "wing";
		} else {
			type = "point";
		}
	} else {
		// eslint-disable-next-line no-lonely-if
		if (randType < 0.03) {
			type = "point";
		} else if (randType < 0.3) {
			type = "big";
		} else {
			type = "wing";
		}
	}

	// Tall players are less talented, and all tend towards dumb and can't shoot because they are rookies
	const rawRatings = {
		stre: 44,
		spd: 48,
		jmp: 48,
		endu: 31,
		ins: 38,
		dnk: 44,
		ft: 40,
		fg: 40,
		tp: 41,
		oiq: 37,
		diq: 37,
		drb: 46,
		pss: 43,
		reb: 45,
	};

	// For correlation across ratings, to ensure some awesome players, but athleticism and skill are independent to
	// ensure there are some who are elite in one but not the other
	const factorBig = helpers.bound(random.realGauss(1, 0.5), 0.2, 1.8);
	const factorAthleticism = helpers.bound(random.realGauss(1, 0.5), 0.2, 1.8);
	const factorShooting = helpers.bound(random.realGauss(1, 0.5), 0.2, 1.8);
	const factorSkill = helpers.bound(random.realGauss(1, 0.5), 0.2, 1.8);
	const bigRatings = ["stre", "ins", "reb", "endu", "dnk"];
	const athleticismRatings = ["spd", "jmp"];
	const shootingRatings = ["ft", "fg", "tp"];
	const skillRatings = ["oiq", "diq", "drb", "pss"];

	for (const key of helpers.keys(rawRatings)) {
		const typeFactor = typeFactors[type].hasOwnProperty(key)
			? typeFactors[type][key]
			: 1;
		let factor = 1;

		if (athleticismRatings.includes(key)) {
			factor = factorAthleticism;
		} else if (shootingRatings.includes(key)) {
			factor = factorShooting;
		} else if (skillRatings.includes(key)) {
			factor = factorSkill;
		} else if (bigRatings.includes(key)) {
			factor = factorBig;
		}
		// For TypeScript
		// https://github.com/microsoft/TypeScript/issues/21732
		if (typeFactor === undefined) {
			throw new Error("Should never happen");
		}

		rawRatings[key] = limitRating(
			factor * typeFactor ** 3 * random.realGauss(rawRatings[key], 5),
		);
	}

	const ratings = {
		stre: rawRatings.stre,
		spd: rawRatings.spd,
		jmp: rawRatings.jmp,
		endu: rawRatings.endu,
		ins: rawRatings.ins,
		dnk: rawRatings.dnk,
		ft: rawRatings.ft,
		fg: rawRatings.fg,
		tp: rawRatings.tp,
		oiq: rawRatings.oiq,
		diq: rawRatings.diq,
		drb: rawRatings.drb,
		pss: rawRatings.pss,
		reb: rawRatings.reb,
		hgt,
		fuzz: genFuzz(scoutingRank),
		ovr: 0,
		pos: "F",
		pot: 0,
		season,
		skills: [],
	};

	return {
		heightInInches,
		ratings,
	};
};

export default genRatings;
