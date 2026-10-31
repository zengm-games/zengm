import { applyFuzz, getFuzz } from "./fuzzRating.ts";

const fuzzOvrs = (ovrs: Record<string, number> | undefined, fuzz: number) => {
	if (ovrs === undefined) {
		return;
	}

	const fuzzed = { ...ovrs };

	const fuzzValue = getFuzz(fuzz);
	if (fuzzValue !== 0) {
		for (const key of Object.keys(fuzzed)) {
			fuzzed[key] = applyFuzz(fuzzed[key]!, fuzzValue);
		}
	}

	return fuzzed;
};

export default fuzzOvrs;
