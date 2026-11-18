import {
	scoutingEffectCutoff,
	scoutingEffectStddev,
} from "../../../common/budgetLevels.ts";
import { gauss } from "../../../common/random.ts";

const genFuzz = (scoutingLevel: number): number => {
	// 1 to 8
	const cutoff = scoutingEffectCutoff(scoutingLevel);

	// 1 to 3
	const stddev = scoutingEffectStddev(scoutingLevel);

	let fuzz = gauss(0, stddev);

	if (fuzz > cutoff) {
		fuzz = cutoff;
	} else if (fuzz < -cutoff) {
		fuzz = -cutoff;
	}

	return fuzz;
};

export default genFuzz;
