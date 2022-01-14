import limitRating from "./limitRating";
import { g, helpers, random } from "../../util";
import type {
	PlayerRatings,
	RatingKey,
} from "../../../common/types.basketball";

// (age coefficient, age offset) for mean, than std. dev.
const ratingsFormulas: Record<Exclude<RatingKey, "hgt">, Array<number>> = {
	diq: [0.008, -0.18, -0.0, 0.0012],
	dnk: [0.006, -0.1601, -0.0009, 0.0317],
	drb: [0.0087, -0.2156, 0.0, 0.0],
	endu: [-0.0398, 1.0722, 0.0029, -0.0604],
	fg: [0.0024, -0.0443, -0.0008, 0.054],
	ft: [0.0052, -0.1124, -0.0012, 0.0704],
	ins: [0.0027, -0.0933, -0.0006, 0.083],
	jmp: [-0.0146, 0.2996, 0.0077, -0.1821],
	oiq: [-0.0016, 0.0676, -0.0, 0.0012],
	pss: [0.0062, -0.1502, -0.0, 0.0001],
	reb: [0.0067, -0.1769, -0.0, 0.0006],
	spd: [-0.0079, 0.1606, 0.0033, -0.0793],
	stre: [-0.0019, 0.0375, 0.0, 0.0],
	tp: [0.0079, -0.1909, -0.0025, 0.1013],
};

const calcBaseChange = (age: number, coachingRank: number): number => {
	let val: number;

	const base_coef = [-0.0148, 0.3846, -0.0001, 0.1659];

	val = base_coef[0] * age + base_coef[1];
	const std_base = base_coef[2] * age + base_coef[3];
	const std_noise = helpers.bound(
		random.realGauss(0, Math.max(0.00001, std_base)),
		-0.1,
		0.4,
	);
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
		const ageStd =
			ratingsFormulas[key][2] * age_bounds + ratingsFormulas[key][3];

		const ageChange =
			ageModifier +
			helpers.bound(random.realGauss(0, Math.max(0.00001, ageStd)), -0.4, 0.5);
		ratings[key] = limitRating(
			(Math.sqrt(Math.max(1, ratings[key])) + baseChange + ageChange) ** 2,
		);
		//console.log(baseChange,ageChange);
	}
};

export default developSeason;
