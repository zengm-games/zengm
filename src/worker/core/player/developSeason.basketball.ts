import limitRating from "./limitRating.ts";
import { helpers, random } from "../../util/index.ts";
import type {
	PlayerRatings,
	RatingKey,
} from "../../../common/types.basketball.ts";
import { coachingEffect } from "../../../common/budgetLevels.ts";

type RatingFormula = {
	ageModifier: (age: number, peakAge?: number) => number;
	changeLimits: (age: number) => [number, number];
};

/**
 * Get position-specific peak age.
 * Guards tend to peak earlier (athleticism-based)
 * Bigs tend to peak later (skill and positioning-based)
 */
const getPositionPeakAge = (pos: string): number => {
	switch (pos) {
		case "PG":
			return 26; // Point guards - peak athleticism early, but IQ helps
		case "SG":
			return 26; // Shooting guards - similar to PG
		case "SF":
			return 27; // Small forwards - balance of skills
		case "PF":
			return 28; // Power forwards - learn positioning over time
		case "C":
			return 29; // Centers - late bloomers, less reliant on athleticism
		case "G":
			return 26;
		case "F":
			return 27;
		case "GF":
			return 26;
		case "FC":
			return 28;
		default:
			return 27; // Default peak
	}
};

const shootingFormula: RatingFormula = {
	ageModifier: (age: number) => {
		// Reverse most of the age-related decline in calcBaseChange
		if (age <= 27) {
			return 0;
		}

		if (age <= 29) {
			return 0.5;
		}

		if (age <= 31) {
			return 1.5;
		}

		return 2;
	},
	changeLimits: () => [-3, 13],
};
const iqFormula: RatingFormula = {
	ageModifier: (age: number) => {
		if (age <= 21) {
			return 4;
		}

		if (age <= 23) {
			return 3;
		}

		// Reverse most of the age-related decline in calcBaseChange
		if (age <= 27) {
			return 0;
		}

		if (age <= 29) {
			return 0.5;
		}

		if (age <= 31) {
			return 1.5;
		}

		return 2;
	},
	changeLimits: (age) => {
		if (age >= 24) {
			return [-3, 9];
		}

		// For 19: [-3, 32]
		// For 23: [-3, 12]
		return [-3, 7 + 5 * (24 - age)];
	},
};
const ratingsFormulas: Record<Exclude<RatingKey, "hgt">, RatingFormula> = {
	stre: {
		ageModifier: () => 0,
		changeLimits: () => [-Infinity, Infinity],
	},
	spd: {
		ageModifier: (age: number) => {
			if (age <= 27) {
				return 0;
			}

			if (age <= 30) {
				return -2;
			}

			if (age <= 35) {
				return -3;
			}

			if (age <= 40) {
				return -4;
			}

			return -8;
		},
		changeLimits: () => [-12, 2],
	},
	jmp: {
		ageModifier: (age: number) => {
			if (age <= 26) {
				return 0;
			}

			if (age <= 30) {
				return -3;
			}

			if (age <= 35) {
				return -4;
			}

			if (age <= 40) {
				return -5;
			}

			return -10;
		},
		changeLimits: () => [-12, 2],
	},
	endu: {
		ageModifier: (age: number) => {
			if (age <= 23) {
				return random.uniform(0, 9);
			}

			if (age <= 30) {
				return 0;
			}

			if (age <= 35) {
				return -2;
			}

			if (age <= 40) {
				return -4;
			}

			return -8;
		},
		changeLimits: () => [-11, 19],
	},
	dnk: {
		ageModifier: (age: number) => {
			// Like shootingForumla, except for old players
			if (age <= 27) {
				return 0;
			}

			return 0.5;
		},
		changeLimits: () => [-3, 13],
	},
	ins: shootingFormula,
	ft: shootingFormula,
	fg: shootingFormula,
	tp: shootingFormula,
	oiq: iqFormula,
	diq: iqFormula,
	drb: {
		ageModifier: shootingFormula.ageModifier,
		changeLimits: () => [-2, 5],
	},
	pss: {
		ageModifier: shootingFormula.ageModifier,
		changeLimits: () => [-2, 5],
	},
	reb: {
		ageModifier: shootingFormula.ageModifier,
		changeLimits: () => [-2, 5],
	},
};

/**
 * Calculate base change in ratings based on age and position-specific peak.
 * @param age Player's current age
 * @param coachingLevel Coaching quality level
 * @param peakAge Position-specific peak age (default 27)
 * @param isLateBloomer If true, player develops slower but longer
 */
const calcBaseChange = (
	age: number,
	coachingLevel: number,
	peakAge: number = 27,
	isLateBloomer: boolean = false,
): number => {
	let val: number;

	// Adjust development curve based on position-specific peak age
	const peakOffset = peakAge - 27; // How many years later/earlier this position peaks
	const adjustedAge = age - peakOffset;

	// Late bloomers have extended development but slower decline
	const lateBloomerOffset = isLateBloomer ? 2 : 0;
	const effectiveAge = adjustedAge - lateBloomerOffset;

	if (effectiveAge <= 21) {
		val = isLateBloomer ? 1.5 : 2; // Late bloomers improve slower when young
	} else if (effectiveAge <= 25) {
		val = 1;
	} else if (effectiveAge <= 27) {
		val = 0;
	} else if (effectiveAge <= 29) {
		val = isLateBloomer ? -0.5 : -1; // Late bloomers decline slower
	} else if (effectiveAge <= 31) {
		val = isLateBloomer ? -1 : -2;
	} else if (effectiveAge <= 34) {
		val = isLateBloomer ? -2 : -3;
	} else if (effectiveAge <= 40) {
		val = isLateBloomer ? -3 : -4;
	} else if (effectiveAge <= 43) {
		val = isLateBloomer ? -4 : -5;
	} else {
		val = isLateBloomer ? -5 : -6;
	}

	// Noise - late bloomers have more variance (could really break out)
	const noiseMultiplier = isLateBloomer ? 1.3 : 1.0;
	if (effectiveAge <= 23) {
		val += helpers.bound(random.realGauss(0, 5 * noiseMultiplier), -4, 20);
	} else if (effectiveAge <= 25) {
		val += helpers.bound(random.realGauss(0, 5 * noiseMultiplier), -4, 10);
	} else {
		val += helpers.bound(random.realGauss(0, 3), -2, 4);
	}

	val *= 1 + (val > 0 ? 1 : -1) * coachingEffect(coachingLevel);

	return val;
};

/**
 * Check if a player is a "late bloomer" based on their ratings profile.
 * Late bloomers have high potential relative to current ability and tend to be
 * bigger players with room to develop skills.
 */
const isLateBloomer = (ratings: PlayerRatings): boolean => {
	// Calculate some indicators of late bloomer potential
	// High IQ but lower physical ratings = likely to improve with experience
	const iqAvg = (ratings.oiq + ratings.diq) / 2;
	const physicalAvg = (ratings.spd + ratings.jmp) / 2;

	// Players with high basketball IQ but lower athleticism often improve later
	if (iqAvg > 55 && physicalAvg < 50) {
		return true;
	}

	// Tall players often take longer to develop coordination
	if (ratings.hgt > 80 && ratings.drb < 45) {
		return true;
	}

	// Low-probability random late bloomer (about 8% of players)
	if (random.random() < 0.08) {
		return true;
	}

	return false;
};

/**
 * Get skill-specific development cap based on player profile.
 * Each player has natural ceilings for different skill categories.
 * This adds variance so not every player develops the same way.
 */
const getSkillCeiling = (
	ratings: PlayerRatings,
	skillKey: Exclude<RatingKey, "hgt">,
): number => {
	// Base ceiling starts at 85-100 depending on player profile
	let baseCeiling = 85 + random.randInt(0, 15);

	// Height affects certain skill ceilings
	if (ratings.hgt > 75) {
		// Tall players have higher ceilings for rebounding, inside scoring, blocking
		if (["reb", "ins", "dnk"].includes(skillKey)) {
			baseCeiling = Math.min(100, baseCeiling + 10);
		}
		// But lower ceilings for perimeter skills
		if (["spd", "drb"].includes(skillKey)) {
			baseCeiling = Math.max(60, baseCeiling - 10);
		}
	} else if (ratings.hgt < 50) {
		// Short players have higher ceilings for speed and ball handling
		if (["spd", "drb", "pss"].includes(skillKey)) {
			baseCeiling = Math.min(100, baseCeiling + 10);
		}
		// But lower ceilings for inside game
		if (["reb", "ins", "dnk"].includes(skillKey)) {
			baseCeiling = Math.max(50, baseCeiling - 15);
		}
	}

	// IQ-based skills have higher ceilings for experienced players
	if (["oiq", "diq"].includes(skillKey)) {
		baseCeiling = Math.min(100, baseCeiling + 5);
	}

	return baseCeiling;
};

const developSeason = (
	ratings: PlayerRatings,
	age: number,
	coachingLevel: number,
) => {
	// In young players, height can sometimes increase
	if (age <= 21) {
		const heightRand = Math.random();

		if (heightRand > 0.99 && age <= 20 && ratings.hgt <= 99) {
			ratings.hgt += 1;
		}

		if (heightRand > 0.999 && ratings.hgt <= 99) {
			ratings.hgt += 1;
		}
	}

	// Get position-specific peak age and check for late bloomer
	const peakAge = getPositionPeakAge(ratings.pos);
	const lateBloomer = isLateBloomer(ratings);

	const baseChange = calcBaseChange(age, coachingLevel, peakAge, lateBloomer);

	for (const key of helpers.keys(ratingsFormulas)) {
		const ageModifier = ratingsFormulas[key].ageModifier(age);
		const changeLimits = ratingsFormulas[key].changeLimits(age);

		let newRating =
			ratings[key] +
			helpers.bound(
				(baseChange + ageModifier) * random.uniform(0.4, 1.4),
				changeLimits[0],
				changeLimits[1],
			);

		// Apply skill-specific ceiling (only limits positive growth)
		if (newRating > ratings[key]) {
			const ceiling = getSkillCeiling(ratings, key);
			newRating = Math.min(newRating, ceiling);
		}

		ratings[key] = limitRating(newRating);
	}
};

export default developSeason;
