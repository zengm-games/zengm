import {
	scoutingEffectCutoff,
	scoutingEffectStddev,
} from "../../../common/budgetLevels.ts";
import { gauss } from "../../../common/random.ts";

const genFuzz = (souctingLevel: number): number => {
	// 1 to 8
	const cutoff = scoutingEffectCutoff(souctingLevel);

	// 1 to 3
	const stddev = scoutingEffectStddev(souctingLevel);

	let fuzz = gauss(0, stddev);

	if (fuzz > cutoff) {
		fuzz = cutoff;
	} else if (fuzz < -cutoff) {
		fuzz = -cutoff;
	}

	return fuzz;
};

export default genFuzz;
