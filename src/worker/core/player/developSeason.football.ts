import { helpers } from "../../util/index.ts";
import type {
	PlayerRatings,
	RatingKey,
} from "../../../common/types.football.ts";
import { uniform, truncGauss } from "../../../common/random.ts";
import {
	addToProgBreakdown,
	getBaseChange,
	getRatingChangeBreakdown,
	type ProgBreakdown,
} from "./developmentBreakdown.ts";

type RatingFormula = {
	ageModifier: (age: number) => number;
	changeLimits: (age: number) => [number, number];
};

const powerFormula: RatingFormula = {
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
	changeLimits: () => [-3, 6],
};
const iqFormula: RatingFormula = {
	ageModifier: (age: number) => {
		if (age <= 21) {
			return 3;
		}

		if (age <= 23) {
			return 2;
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

			return -4;
		},
		changeLimits: () => [-12, 2],
	},
	endu: {
		ageModifier: (age: number) => {
			if (age <= 23) {
				return uniform(0, 9);
			}

			if (age <= 30) {
				return 0;
			}

			return -4;
		},
		changeLimits: () => [-11, 19],
	},
	thv: iqFormula,
	thp: powerFormula,
	tha: powerFormula,
	bsc: {
		ageModifier: () => 0,
		changeLimits: () => [-Infinity, Infinity],
	},
	elu: iqFormula,
	rtr: iqFormula,
	hnd: iqFormula,
	rbk: iqFormula,
	pbk: iqFormula,
	pcv: iqFormula,
	tck: iqFormula,
	prs: iqFormula,
	rns: iqFormula,
	kpw: powerFormula,
	kac: iqFormula,
	ppw: powerFormula,
	pac: iqFormula,
};

const calcBaseChange = (age: number, coachingLevel: number) => {
	let ageChange: number;

	if (age <= 21) {
		ageChange = 2;
	} else if (age <= 25) {
		ageChange = 1;
	} else if (age <= 27) {
		ageChange = 0;
	} else if (age <= 29) {
		ageChange = -1;
	} else if (age <= 31) {
		ageChange = -2;
	} else if (age <= 34) {
		ageChange = -3;
	} else {
		ageChange = -4;
	}

	let randomChange;

	// Noise
	if (age <= 23) {
		randomChange = truncGauss(0, 5, -4, 15);
	} else if (age <= 25) {
		randomChange = truncGauss(0, 5, -4, 7);
	} else {
		randomChange = truncGauss(0, 3, -2, 3);
	}

	return getBaseChange(ageChange, randomChange, coachingLevel);
};

const developSeason = (
	ratings: PlayerRatings,
	age: number,
	coachingLevel: number,
) => {
	const progBreakdown: ProgBreakdown = [0, 0, 0];

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

	const baseChange = calcBaseChange(age, coachingLevel);

	for (const key of helpers.keys(ratingsFormulas)) {
		const ageModifier = ratingsFormulas[key].ageModifier(age);
		const changeLimits = ratingsFormulas[key].changeLimits(age);

		if (ratings[key] < 40 && Math.random() < 0.9) {
			// Players who are bad at something should stay bad
			const maxChange = Math.floor(ratings[key] / 10);

			if (changeLimits[1] > maxChange) {
				changeLimits[1] = maxChange;
			}
		}

		const { newRating, progBreakdown: ratingProgBreakdown } =
			getRatingChangeBreakdown({
				ageModifier,
				baseChange,
				changeLimits,
				factor: uniform(0.4, 1.4),
				oldRating: ratings[key],
			});

		ratings[key] = newRating;
		addToProgBreakdown(progBreakdown, ratingProgBreakdown);
	}

	return progBreakdown;
};

export default developSeason;
