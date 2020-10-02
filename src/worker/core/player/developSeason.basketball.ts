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
	changeLimits: () => [-10, 10],
};

const ratingsFormulas: Record<Exclude<RatingKey, "hgt">, RatingFormula> = {
	stre: {
		ageModifier: () => -0.5,
		changeLimits: () => [-10, 10],
	},
	spd: {
		ageModifier: (age: number) => {
			if (age <= 24) {
				return 0;
			}
			return -0.25 * (age - 24);
		},
		changeLimits: () => [-10, 10],
	},
	jmp: {
		ageModifier: (age: number) => {
			if (age <= 24) {
				return 0;
			}
			return -0.25 * (age - 24);
		},
		changeLimits: () => [-10, 10],
	},
	endu: {
		ageModifier: (age: number) => {
			if (age <= 20) {
				return 4;
			}
			return -0.5 * (age - 20) + 4;
		},
		changeLimits: () => [-20, 20],
	},
	dnk: defaultFormula,
	ins: defaultFormula,
	ft: defaultFormula,
	fg: defaultFormula,
	tp: defaultFormula,
	oiq: defaultFormula,
	diq: defaultFormula,
	drb: defaultFormula,
	pss: defaultFormula,
	reb: defaultFormula,
};

const calcBaseChange = (age: number, coachingRank: number): number => {
	let val: number;

	if (age <= 20) {
		val = 2;
	} else {
		val = -0.35 * (age - 20) + 2;
	}

	// Noise
	if (age <= 23) {
		val += helpers.bound(random.realGauss(0, 7), -5, 20);
	} else if (age <= 28) {
		val += helpers.bound(random.realGauss(0, 6), -7, 20);
	} else {
		val += helpers.bound(random.realGauss(0, 5), -10, 10);
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
					(ratingsNumbers[key] + ageModifier) * random.uniform(0.4, 1.4),
					changeLimits[0],
					changeLimits[1],
				),
		);
	}
};

export default developSeason;
