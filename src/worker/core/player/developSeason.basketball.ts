import limitRating from "./limitRating";
import { g, helpers, random } from "../../util";
import type {
	PlayerRatings,
	RatingKey,
} from "../../../common/types.basketball";

// (age coefficient, age offset) for mean, than std. dev.
const ratingsFormulas: Record<Exclude<RatingKey, "hgt">, Array<number>> = {
	diq: [0.0023, -0.0524, -0.0, 0.0003],
	dnk: [0.0018, -0.0465, -0.0003, 0.0091],
	drb: [0.0026, -0.0648, 0.0, 0.0],
	endu: [-0.012, 0.3214, 0.0016, -0.0357],
	fg: [0.0011, -0.0236, -0.0004, 0.0191],
	ft: [0.0018, -0.0396, -0.0007, 0.0285],
	ins: [0.0005, -0.0197, 0.0003, 0.0108],
	jmp: [-0.0051, 0.1082, 0.0041, -0.102],
	oiq: [-0.0003, 0.0137, -0.0, 0.0014],
	pss: [0.0019, -0.046, -0.0, 0.0001],
	reb: [0.0019, -0.0506, -0.0, 0.0001],
	spd: [-0.002, 0.0402, 0.001, -0.0252],
	stre: [-0.0001, -0.0001, 0.0, 0.0],
	tp: [0.0024, -0.0596, -0.0012, 0.0385],
};

const calcBaseChange = (age: number, coachingRank: number): number => {
	let val: number;

	const base_coef = [-0.0039, 0.1018, 0.0003, 0.0266];

	val = base_coef[0] * age + base_coef[1];
	const std_base = base_coef[2] * age + base_coef[3];
	const std_noise = helpers.bound(
		random.realGauss(0, Math.max(0.00001, std_base)),
		-0.05,
		0.35,
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
			helpers.bound(random.realGauss(0, Math.max(0.00001, ageStd)), -0.2, 0.3);
		ratings[key] = limitRating(
			Math.exp(Math.log(Math.max(1, ratings[key])) + baseChange + ageChange),
		);
		//console.log(baseChange,ageChange);
	}
};

export default developSeason;
