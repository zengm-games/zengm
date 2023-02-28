import { isSport } from "../../../common";
import { g, random } from "../../util";

const genWeight = (hgt: number, stre?: number, pos?: string) => {
	let MIN_WEIGHT = 155;
	let MAX_WEIGHT = 305;

	if (stre === undefined) {
		stre = hgt;
	}

	const female = g.get("gender") === "female";

	let weight;
	if (isSport("football")) {
		if (pos === "OL") {
			if (!female) {
				MIN_WEIGHT = 280;
				MAX_WEIGHT = 350;
			}
			weight =
				random.randInt(-20, 20) +
				((hgt + 0.5 * stre) * (MAX_WEIGHT - MIN_WEIGHT)) / 150 +
				MIN_WEIGHT;
		} else {
			weight =
				random.randInt(-20, 20) +
				((hgt + 0.5 * stre) * (MAX_WEIGHT - MIN_WEIGHT)) / 150 +
				MIN_WEIGHT;
		}
	} else {
		weight =
			random.randInt(-20, 20) +
			((hgt + 0.5 * stre) * (MAX_WEIGHT - MIN_WEIGHT)) / 150 +
			MIN_WEIGHT;
	}

	weight *= g.get("weightFactor");

	if (female) {
		// Ratio comes from average USA stats, adjusted a bit down because they still seem to high
		return Math.round(0.75 * weight);
	}

	return Math.round(weight);
};

export default genWeight;
