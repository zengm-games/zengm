import { random } from "../../util";

const MIN_WEIGHT = 155;
const MAX_WEIGHT = 305;

const genWeight = (hgt: number, stre: number) => {
	if (process.env.SPORT === "football") {
		return Math.round(
			random.randInt(-20, 20) +
				((hgt + 0.5 * stre) * (MAX_WEIGHT - MIN_WEIGHT)) / 150 +
				MIN_WEIGHT,
		);
	}

	return Math.round(
		random.randInt(-20, 20) +
			((hgt + 0.5 * stre) * (MAX_WEIGHT - MIN_WEIGHT)) / 150 +
			MIN_WEIGHT,
	);
};

export default genWeight;
