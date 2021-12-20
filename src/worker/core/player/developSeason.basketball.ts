import limitRating from "./limitRating";
import { g, helpers, random } from "../../util";
import type {
	PlayerRatings,
	RatingKey,
} from "../../../common/types.basketball";

// (age coefficient, age offset) for mean, than std. dev.
const ratingsFormulas: Record<Exclude<RatingKey, "hgt">, Array<number>> = {
	diq: [0.0026, -0.058, -0.0, 0.0006],
	dnk: [0.0021, -0.0556, -0.0004, 0.0115],
	drb: [0.0031, -0.0764, 0.0, 0.0],
	endu: [-0.0146, 0.392, 0.0025, -0.0572],
	fg: [0.0012, -0.0254, -0.0004, 0.0275],
	ft: [0.002, -0.0463, -0.0011, 0.0523],
	ins: [0.0008, -0.029, 0.0005, 0.016],
	jmp: [-0.0058, 0.1244, 0.0068, -0.1686],
	oiq: [-0.0004, 0.0183, -0.0001, 0.0018],
	pss: [0.0023, -0.0551, -0.0, 0.0002],
	reb: [0.0023, -0.0617, -0.0, 0.0002],
	spd: [-0.0022, 0.043, 0.0015, -0.0368],
	stre: [-0.0001, -0.0, 0.0, 0.0],
	tp: [0.0028, -0.0686, -0.0017, 0.0524],
};

const calcBaseChange = (age: number, coachingRank: number): number => {
	let val: number;

	const base_coef = [-0.0047, 0.1225, 0.0006, 0.0421];

	val = base_coef[0] * age + base_coef[1];
	const std_base = base_coef[2] * age + base_coef[3];
	const std_noise = helpers.bound(
		random.realGauss(0, Math.max(0.00001, std_base)),
		-0.05,
		0.25,
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
			helpers.bound(
				random.realGauss(0, Math.max(0.00001, ageStd)),
				-0.05,
				0.25,
			);
		ratings[key] = limitRating(
			Math.exp(Math.log(Math.max(0.1, ratings[key])) + baseChange + ageChange),
		);
		//console.log(baseChange,ageChange);
	}
};

export default developSeason;
