import { random } from "../../util";

const genWeight = (hgt: number, stre: number, pos?: string) => {
	let MIN_WEIGHT = 155;
	let MAX_WEIGHT = 305;

	if (process.env.SPORT === "football") {
		if (pos === "OL") {
			MIN_WEIGHT = 280;
			MAX_WEIGHT = 350;
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
	}

	return Math.round(
		random.randInt(-20, 20) +
			((hgt + 0.5 * stre) * (MAX_WEIGHT - MIN_WEIGHT)) / 150 +
			MIN_WEIGHT,
	);
};

export default genWeight;
