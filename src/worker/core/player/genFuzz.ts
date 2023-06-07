import { scoutingEffect } from "../../../common/budgetLevels";
import { random } from "../../util";

const genFuzz = (souctingLevel: number): number => {
	const effect = scoutingEffect(souctingLevel);

	// 1 to 8
	const cutoff = effect;

	// 1 to 3
	const stddev = ((effect - 1) * 3) / 7;

	let fuzz = random.gauss(0, stddev);

	if (fuzz > cutoff) {
		fuzz = cutoff;
	} else if (fuzz < -cutoff) {
		fuzz = -cutoff;
	}

	return fuzz;
};

export default genFuzz;
