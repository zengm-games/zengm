import limitRating from "./limitRating";
import { helpers, random } from "../../util";
import type { PlayerRatings } from "../../../common/types.basketball";
import { coachingEffect } from "../../../common/budgetLevels";

// (age coefficient, age offset) for mean, and stddev
const ratingsFormulas = {
	diq: [-0.1, 2.841, -0.95],
	dnk: [-0.052, 1.781, 1.205],
	drb: [0.097, -3.06, -0.014],
	endu: [-0.52, 13.842, 2.301],
	fg: [0.015, 0.07, 0.544],
	ft: [0.155, -3.891, -0.071],
	ins: [-0.032, 0.924, 0.756],
	jmp: [-0.247, 5.446, 1.486],
	oiq: [0.076, -2.039, 0.406],
	pss: [0.157, -4.602, 0.288],
	reb: [0.042, -0.964, -0.098],
	spd: [-0.057, 0.44, 0.323],
	stre: [-0.099, 2.675, 0.231],
	tp: [0.138, -3.909, 0.68],
} satisfies Record<string, [number, number, number]>;

const calcBaseChange = (age: number, coachingLevel: number) => {
	let val;

	const base_coef = [-0.327, 10, 4.202];

	val = base_coef[0] * age + base_coef[1];
	const std_base = base_coef[2];
	const std_noise = helpers.bound(random.realGauss() * std_base, -1, 4);
	val += std_noise;

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

	const ageBound = helpers.bound(age, 19, 50);

	const baseChangeA = calcBaseChange(ageBound, coachingLevel);
	const baseChangeS = calcBaseChange(ageBound, coachingLevel);
	const baseChangeO = calcBaseChange(ageBound, coachingLevel);
	const baseChangeD = calcBaseChange(ageBound, coachingLevel);

	const baseChanges = {
		stre: (baseChangeA + baseChangeD) / 2,
		spd: baseChangeA,
		jmp: baseChangeA,
		endu: baseChangeA,
		dnk: (baseChangeA + baseChangeS) / 2,
		ins: (baseChangeO + baseChangeS) / 2,
		ft: baseChangeS,
		fg: baseChangeS,
		tp: baseChangeS,
		oiq: baseChangeO,
		diq: baseChangeD,
		drb: baseChangeO,
		pss: baseChangeO,
		reb: baseChangeD,
	};

	for (const key of helpers.keys(ratingsFormulas)) {
		const ageModifier =
			ratingsFormulas[key][0] * ageBound + ratingsFormulas[key][1];
		const ageStd = ratingsFormulas[key][2];

		const ageChange =
			ageModifier + helpers.bound(random.realGauss() * ageStd, -3, 5);
		ratings[key] = limitRating(
			ratings[key] + 0.5 * (baseChanges[key] + ageChange),
		);
	}
};

export default developSeason;
