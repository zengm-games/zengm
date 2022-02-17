import limitRating from "./limitRating";
import { g, helpers, random } from "../../util";
import type {
	PlayerRatings,
	RatingKey,
} from "../../../common/types.basketball";

// (age coefficient, age offset) for mean, than std. dev.
const ratingsFormulas: Record<Exclude<RatingKey, "hgt">, Array<number>> = {
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
};

const calcBaseChange = (age: number, coachingRank: number): number => {
	let val: number;

	const base_coef = [-0.327, 8.0, 4.202];

	val = base_coef[0] * age + base_coef[1];
	const std_base = base_coef[2];
	const std_noise = helpers.bound(random.realGauss() * std_base, -1, 4);
	val += std_noise;

	if (g.hasOwnProperty("numActiveTeams")) {
		const numActiveTeams = g.get("numActiveTeams");
		if (numActiveTeams > 1) {
			if (val >= 0) {
				val *= ((coachingRank - 1) * -0.5) / (numActiveTeams - 1) + 1.25;
			} else {
				val *= ((coachingRank - 1) * 0.5) / (numActiveTeams - 1) + 0.75;
			}
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
	const age_bounds = helpers.bound(age, 19, 50);

	const baseChange = calcBaseChange(age_bounds, coachingRank);

	for (const key of helpers.keys(ratingsFormulas)) {
		const ageModifier =
			ratingsFormulas[key][0] * age_bounds + ratingsFormulas[key][1];
		const ageStd = ratingsFormulas[key][2];

		const ageChange =
			ageModifier + helpers.bound(random.realGauss() * ageStd, -3, 5);
		ratings[key] = limitRating(ratings[key] + baseChange + ageChange);
		//console.log(baseChange,ageChange);
	}
};

export default developSeason;
