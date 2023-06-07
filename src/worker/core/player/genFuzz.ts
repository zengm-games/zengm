import {
	scoutingEffectCutoff,
	scoutingEffectStddev,
} from "../../../common/budgetLevels";
import { random } from "../../util";

const genFuzz = (souctingLevel: number): number => {
	// 1 to 8
	const cutoff = scoutingEffectCutoff(souctingLevel);

	// 1 to 3
	const stddev = scoutingEffectStddev(souctingLevel);

	let fuzz = random.gauss(0, stddev);

	if (fuzz > cutoff) {
		fuzz = cutoff;
	} else if (fuzz < -cutoff) {
		fuzz = -cutoff;
	}

	return fuzz;
};

export default genFuzz;
