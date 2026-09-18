import fuzzRating from "./fuzzRating.ts";
import g from "../../util/g.ts";

const fuzzOvrs = (ovrs: Record<string, number> | undefined, fuzz: number) => {
	if (ovrs === undefined) {
		return;
	}

	const fuzzed = { ...ovrs };

	if (fuzz !== 0) {
		if (
			(Object.hasOwn(g, "userTids") && g.get("userTids").length > 1) ||
			(Object.hasOwn(g, "godMode") && g.get("godMode"))
		) {
			// In God Mode or Multi Team Mode, no fuzz is applied
			return fuzzed;
		}

		for (const key of Object.keys(fuzzed)) {
			fuzzed[key] = fuzzRating(fuzzed[key]!, fuzz);
		}
	}

	return fuzzed;
};

export default fuzzOvrs;
