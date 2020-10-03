import limitRating from "./limitRating";
import { g, helpers, random } from "../../util";
import type {
	PlayerRatings,
	RatingKey,
} from "../../../common/types.basketball";

type RatingFormula = {
	ageModifier: (age: number) => number;
	changeLimits: (age: number) => [number, number];
};

const defaultFormula: RatingFormula = {
	ageModifier: (age: number) => {
		return 0;
	},
	changeLimits: (age: number) => {
		if (age <= 23) {
			return [-2, 10];
		} else if (age <= 25) {
			return [-10, 5];
		}
		const age_adj = -0.5 * (age - 25);
		return [-15 + age_adj, 3 + age_adj];
	},
};

const ratingsFormulas: Record<Exclude<RatingKey, "hgt">, RatingFormula> = {
	stre: {
		ageModifier: (age: number) => {
			return -0.4;
		},
		changeLimits: (age: number) => defaultFormula.changeLimits(age),
	},
	spd: {
		ageModifier: (age: number) => {
			if (age <= 20) {
				return -0.1;
			}
			return -0.2 * (age - 20) + -0.1;
		},
		changeLimits: (age: number) => defaultFormula.changeLimits(age),
	},
	jmp: defaultFormula,
	endu: {
		ageModifier: (age: number) => {
			if (age <= 20) {
				return 3.7;
			}
			return -0.5 * (age - 20) + 3.7;
		},
		changeLimits: (age: number) => defaultFormula.changeLimits(age),
	},
	dnk: {
		ageModifier: (age: number) => {
			if (age <= 20) {
				return -0.2;
			}
			return 0.1 * (age - 20) + -0.2;
		},
		changeLimits: (age: number) => defaultFormula.changeLimits(age),
	},
	ins: {
		ageModifier: (age: number) => {
			if (age <= 20) {
				return -1.1;
			}
			return 0.2 * (age - 20) + -1.1;
		},
		changeLimits: (age: number) => defaultFormula.changeLimits(age),
	},
	ft: {
		ageModifier: (age: number) => {
			if (age <= 20) {
				return -0.4;
			}
			return 0.1 * (age - 20) + -0.4;
		},
		changeLimits: (age: number) => defaultFormula.changeLimits(age),
	},
	fg: defaultFormula,
	tp: {
		ageModifier: (age: number) => {
			if (age <= 20) {
				return -1.2;
			}
			return 0.2 * (age - 20) + -1.2;
		},
		changeLimits: (age: number) => defaultFormula.changeLimits(age),
	},
	oiq: {
		ageModifier: (age: number) => {
			return 0;
		},
		changeLimits: (age: number) => defaultFormula.changeLimits(age),
	},
	diq: {
		ageModifier: (age: number) => {
			if (age <= 20) {
				return -0.7;
			}
			return 0.1 * (age - 20) + -0.7;
		},
		changeLimits: (age: number) => defaultFormula.changeLimits(age),
	},
	drb: {
		ageModifier: (age: number) => {
			if (age <= 20) {
				return -1.4;
			}
			return 0.2 * (age - 20) + -1.4;
		},
		changeLimits: (age: number) => defaultFormula.changeLimits(age),
	},
	pss: {
		ageModifier: (age: number) => {
			if (age <= 20) {
				return -1.1;
			}
			return 0.2 * (age - 20) + -1.1;
		},
		changeLimits: (age: number) => defaultFormula.changeLimits(age),
	},
	reb: {
		ageModifier: (age: number) => {
			if (age <= 20) {
				return -0.7;
			}
			return 0.1 * (age - 20) + -0.7;
		},
		changeLimits: (age: number) => defaultFormula.changeLimits(age),
	},
};

const calcBaseChange = (age: number, coachingRank: number): number => {
	let val: number;

	if (age <= 19) {
		val = 2.2;
	} else {
		val = -0.3 * (age - 19) + 2.2;
	}

	// Noise
	if (age <= 23) {
		val += helpers.bound(random.realGauss(0, 7), -5, 20);
	} else if (age <= 28) {
		val += helpers.bound(random.realGauss(0, 6), -10, 15);
	} else {
		val += helpers.bound(random.realGauss(0, 5), -15, 10);
	}

	// Modulate by coaching. g.get("numActiveTeams") doesn't exist when upgrading DB, but that doesn't matter
	if (g.hasOwnProperty("numActiveTeams")) {
		if (val >= 0) {
			val *= ((coachingRank - 1) * -0.5) / (g.get("numActiveTeams") - 1) + 1.25;
		} else {
			val *= ((coachingRank - 1) * 0.5) / (g.get("numActiveTeams") - 1) + 0.75;
		}
	}

	return val;
};

const developSeason = (
	ratings: PlayerRatings,
	age: number,
	coachingRank: number = (g.get("numActiveTeams") + 1) / 2,
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
	const baseChange1 = calcBaseChange(age, coachingRank);
	const baseChange2 = calcBaseChange(age, coachingRank);

	const ratingsNumbers: Record<Exclude<RatingKey, "hgt">, number> = {
		stre: baseChange1,
		spd: baseChange2,
		jmp: baseChange2,
		endu: baseChange1,
		dnk: baseChange1,
		ins: baseChange1,
		ft: baseChange2,
		fg: baseChange2,
		tp: baseChange2,
		oiq: baseChange2,
		diq: baseChange1,
		drb: baseChange2,
		pss: baseChange2,
		reb: baseChange1,
	};

	for (const key of helpers.keys(ratingsFormulas)) {
		const ageModifier = ratingsFormulas[key].ageModifier(age);
		const changeLimits = ratingsFormulas[key].changeLimits(age);

		ratings[key] = limitRating(
			ratings[key] +
				helpers.bound(
					(ratingsNumbers[key] + ageModifier) * random.uniform(0.7, 1.3),
					changeLimits[0],
					changeLimits[1],
				),
		);
	}
};

export default developSeason;
