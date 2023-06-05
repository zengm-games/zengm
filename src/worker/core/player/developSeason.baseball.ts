import limitRating from "./limitRating";
import { helpers, random } from "../../util";
import type { PlayerRatings, RatingKey } from "../../../common/types.baseball";
import { coachingEffect } from "../../../common/budgetLevels";

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
	changeLimits: () => [-6, 6],
};
const powerFormulaMinus: RatingFormula = {
	ageModifier: (age: number) => {
		// Reverse most of the age-related decline in calcBaseChange
		if (age <= 27) {
			return -0.25;
		}

		if (age <= 29) {
			return 0.25;
		}

		if (age <= 31) {
			return 1.25;
		}

		return 2;
	},
	changeLimits: () => [-6, 6],
};
const powerFormulaPlus: RatingFormula = {
	ageModifier: (age: number) => {
		// Reverse most of the age-related decline in calcBaseChange
		if (age <= 27) {
			return 0.5;
		}

		if (age <= 29) {
			return 0.75;
		}

		if (age <= 31) {
			return 1.5;
		}

		return 2;
	},
	changeLimits: () => [-6, 8],
};
const iqFormula: RatingFormula = {
	ageModifier: (age: number) => {
		if (age <= 21) {
			return 2.75;
		}

		if (age <= 23) {
			return 1.75;
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
	changeLimits: age => {
		if (age >= 24) {
			return [-3, 9];
		}

		// For 19: [-3, 32]
		// For 23: [-3, 12]
		return [-6, 7 + 5 * (24 - age)];
	},
};
const iqFormulaMinus: RatingFormula = {
	ageModifier: (age: number) => {
		if (age <= 21) {
			return 2.5;
		}

		if (age <= 23) {
			return 1.5;
		}

		// Reverse most of the age-related decline in calcBaseChange
		if (age <= 27) {
			return -0.25;
		}

		if (age <= 29) {
			return 0.25;
		}

		if (age <= 31) {
			return 1.25;
		}

		return 1.75;
	},
	changeLimits: age => {
		if (age >= 24) {
			return [-3, 9];
		}

		// For 19: [-3, 32]
		// For 23: [-3, 12]
		return [-6, 7 + 5 * (24 - age)];
	},
};
const iqFormulaPlus: RatingFormula = {
	ageModifier: (age: number) => {
		if (age <= 21) {
			return 4;
		}

		if (age <= 23) {
			return 3.75;
		}

		// Reverse most of the age-related decline in calcBaseChange
		if (age <= 27) {
			return 0.5;
		}

		if (age <= 29) {
			return 0.75;
		}

		if (age <= 31) {
			return 1.5;
		}

		return 2;
	},
	changeLimits: age => {
		if (age >= 24) {
			return [-3, 9];
		}

		// For 19: [-3, 32]
		// For 23: [-3, 12]
		return [-6, 7 + 5 * (24 - age)];
	},
};
const ratingsFormulas: Record<Exclude<RatingKey, "hgt">, RatingFormula> = {
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
	hpw: powerFormulaMinus,
	con: iqFormulaPlus,
	eye: iqFormula,
	gnd: iqFormulaMinus,
	fly: iqFormulaMinus,
	thr: powerFormula,
	cat: powerFormulaPlus,
	ppw: powerFormula,
	ctl: iqFormula,
	mov: iqFormula,
	endu: powerFormula,
};

const calcBaseChange = (age: number, coachingLevel: number): number => {
	let val: number;

	if (age <= 21) {
		val = 2;
	} else if (age <= 25) {
		val = 1;
	} else if (age <= 27) {
		val = 0;
	} else if (age <= 29) {
		val = -1;
	} else if (age <= 31) {
		val = -2;
	} else if (age <= 33) {
		val = -3;
	} else if (age <= 35) {
		val = -4;
	} else if (age <= 37) {
		val = -5;
	} else {
		val = -6;
	}

	// Noise
	if (age <= 23) {
		val += random.truncGauss(0, 5, -4, 15);
	} else if (age <= 25) {
		val += random.truncGauss(0, 5, -4, 7);
	} else {
		val += random.truncGauss(0, 3, -2, 3);
	}

	val *= 1 + (val > 0 ? 1 : -1) * coachingEffect(coachingLevel);

	return val;
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

		ratings[key] = limitRating(
			ratings[key] +
				helpers.bound(
					(baseChange + ageModifier) * random.uniform(0.6, 1.3),
					changeLimits[0],
					changeLimits[1],
				),
		);
	}
};

export default developSeason;
