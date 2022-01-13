import limitRating from "./limitRating";
import { g, helpers, random } from "../../util";
import type {
	PlayerRatings,
	RatingKey,
} from "../../../common/types.basketball";

// (age coefficient, age offset) for mean, than std. dev.
const ratingsFormulas: Record<Exclude<RatingKey, "hgt">, Array<number>> = {
	diq: [0.0025, -0.056, -0.0, 0.0004],
	dnk: [0.002, -0.0518, -0.0003, 0.0104],
	drb: [0.0029, -0.0716, 0.0, 0.0],
	endu: [-0.0135, 0.3619, 0.002, -0.0458],
	fg: [0.0012, -0.0256, -0.0004, 0.0233],
	ft: [0.0019, -0.0434, -0.0009, 0.039],
	ins: [0.0007, -0.0246, 0.0004, 0.0132],
	jmp: [-0.0055, 0.1173, 0.0053, -0.1313],
	oiq: [-0.0003, 0.0163, -0.0001, 0.0016],
	pss: [0.0021, -0.0512, -0.0, 0.0001],
	reb: [0.0022, -0.0569, -0.0, 0.0002],
	spd: [-0.0021, 0.0422, 0.0012, -0.0301],
	stre: [-0.0001, 0.0, 0.0, 0.0],
	tp: [0.0026, -0.0652, -0.0015, 0.0464],
};

const calcBaseChange = (age: number, coachingRank: number): number => {
	let val: number;

	const base_coef = [-0.0044, 0.1138, 0.0004, 0.0341];

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
