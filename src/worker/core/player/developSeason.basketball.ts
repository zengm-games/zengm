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

const ratingsFormulas: Record<Exclude<RatingKey, "hgt">, RatingFormula> = {
	stre: {
		ageModifier: () => -0.5,
		changeLimits: () => [-Infinity, Infinity],
	},
	spd: {
		ageModifier: (age: number) => {
			if (age <= 24) {
				return 0;
			}
			return -0.2 * (age - 24);
		},
		changeLimits: () => [-12, 2],
	},
	jmp: {
		ageModifier: (age: number) => {
			if (age <= 24) {
				return 0;
			}
			return -0.2 * (age - 24);
		},
		changeLimits: () => [-12, 2],
	},
	endu: {
		ageModifier: (age: number) => {
			if (age <= 20) {
				return 4;
			}
			return -0.5 * (age - 20) + 4;
		},
		changeLimits: () => [-11, 19],
	},
	dnk: {
		ageModifier: () => 0,
		changeLimits: () => [-2, 5],
	},
	ins: {
		ageModifier: () => 0,
		changeLimits: () => [-2, 5],
	},
	ft: {
		ageModifier: () => 0,
		changeLimits: () => [-2, 5],
	},
	fg: {
		ageModifier: () => 0,
		changeLimits: () => [-2, 5],
	},
	tp: {
		ageModifier: () => 0,
		changeLimits: () => [-2, 5],
	},
	oiq: {
		ageModifier: () => 0,
		changeLimits: () => [-2, 5],
	},
	diq: {
		ageModifier: () => 0,
		changeLimits: () => [-2, 5],
	},
	drb: {
		ageModifier: () => 0,
		changeLimits: () => [-2, 5],
	},
	pss: {
		ageModifier: () => 0,
		changeLimits: () => [-2, 5],
	},
	reb: {
		ageModifier: () => 0,
		changeLimits: () => [-2, 5],
	},
};

const calcBaseChange = (age: number, coachingRank: number): number => {
	let val: number;

	if (age <= 20) {
		val = 2;
	} else {
		val = -0.33 * (age - 20) + 2;
	}

	// Noise
	if (age <= 23) {
		val += helpers.bound(random.realGauss(0, 7), -10, 20);
	} else if (age <= 28) {
		val += helpers.bound(random.realGauss(0, 6), -15, 15);
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
		oiq: baseChange1,
		diq: baseChange1,
		drb: baseChange2,
		pss: baseChange2,
		reb: baseChange1,
	};
	const mult = 1.4;

	for (const key of helpers.keys(ratingsFormulas)) {
		const ageModifier = ratingsFormulas[key].ageModifier(age);
		const changeLimits = ratingsFormulas[key].changeLimits(age);

		ratings[key] = limitRating(
			ratings[key] +
				helpers.bound(
					(ratingsNumbers[key] + ageModifier) * random.uniform(0.4, 1.4),
					changeLimits[0],
					mult * changeLimits[1],
				),
		);
	}
};

export default developSeason;
