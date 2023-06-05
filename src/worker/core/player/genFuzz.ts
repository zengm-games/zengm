import { scoutingEffect } from "../../../common/budgetLevels";
import { random } from "../../util";

const genFuzz = (souctingLevel: number): number => {
	const effect = scoutingEffect(souctingLevel);

	// 1 to 3
	const stddev = 2 * (1 + effect);

	// 1 to 8
	const cutoff = 4.5 * (1 + (14 / 9) * effect);

	let fuzz = random.gauss(0, stddev);

	if (fuzz > cutoff) {
		fuzz = cutoff;
	} else if (fuzz < -cutoff) {
		fuzz = -cutoff;
	}

	return fuzz;
};

export default genFuzz;
