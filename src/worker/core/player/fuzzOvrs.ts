import fuzzRating from "./fuzzRating";

const fuzzOvrs = (ovrs: Record<string, number> | undefined, fuzz: number) => {
	if (ovrs === undefined) {
		return;
	}

	const fuzzed = { ...ovrs };

	if (fuzz) {
		for (const key of Object.keys(fuzzed)) {
			fuzzed[key] = fuzzRating(fuzzed[key], fuzz);
		}
	}

	return fuzzed;
};

export default fuzzOvrs;
