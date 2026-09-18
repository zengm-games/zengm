import fuzzRating from "./fuzzRating.ts";
import g from "../../util/g.ts";

const fuzzOvrs = (ovrs: Record<string, number> | undefined, fuzz: number) => {
	if (ovrs === undefined) {
		return;
	}

	const fuzzed = { ...ovrs };

	if (fuzz) {
		// All positional ratings use the same league settings during this call.
		if (
			(Object.hasOwn(g, "userTids") && g.get("userTids").length > 1) ||
			(Object.hasOwn(g, "godMode") && g.get("godMode"))
		) {
			fuzz = 0;
		}
		for (const key of Object.keys(fuzzed)) {
			fuzzed[key] = fuzzRating(fuzzed[key]!, fuzz, true);
		}
	}

	return fuzzed;
};

export default fuzzOvrs;
