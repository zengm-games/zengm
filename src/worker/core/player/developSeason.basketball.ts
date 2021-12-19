import limitRating from "./limitRating";
import { g, helpers, random } from "../../util";
import type {
	PlayerRatings,
	RatingKey,
} from "../../../common/types.basketball";

// (age coefficient, age offset) for mean, than std. dev.
const ratingsFormulas: Record<Exclude<RatingKey, "hgt">, Array<number>> = {
	diq: [0.06, -1.098, 0.0, -0.011],
	dnk: [0.029, -0.923, -0.008, 0.342],
	drb: [0.064, -1.472, 0.0, 0.0],
	endu: [-0.464, 12.505, 0.04, -0.873],
	fg: [-0.005, 0.362, -0.004, 0.583],
	ft: [0.025, -0.217, 0.003, 0.533],
	ins: [0.016, -0.652, -0.034, 1.956],
	jmp: [-0.166, 3.191, 0.074, -1.511],
	oiq: [-0.042, 1.451, -0.0, 0.014],
	pss: [0.04, -0.81, -0.001, 0.064],
	reb: [0.045, -1.114, -0.0, 0.004],
	spd: [-0.111, 2.399, 0.047, -0.983],
	stre: [-0.039, 1.018, 0.001, -0.013],
	tp: [0.095, -2.109, -0.009, 1.092],
};

const calcBaseChange = (age: number, coachingRank: number): number => {
	let val: number;

	const base_coef = [-0.174, 4.475, -0.001, 3.455];

	val = base_coef[0] * age + base_coef[1];
	const std_base = base_coef[2] * age + base_coef[3];
	val += helpers.bound(
		random.realGauss(0, 0.05 + Math.max(0, std_base)),
		-5,
		15,
	);

	// Modulate by coaching. g.get("numActiveTeams") doesn't exist when upgrading DB, but that doesn't matter
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
		const ageStd =
			ratingsFormulas[key][2] * age_bounds + ratingsFormulas[key][3];

		ratings[key] = limitRating(
			ratings[key] +
				baseChange +
				ageModifier +
				helpers.bound(random.realGauss(0, 0.05 + Math.max(0, ageStd)), -5, 5),
		);
	}
};

export default developSeason;
