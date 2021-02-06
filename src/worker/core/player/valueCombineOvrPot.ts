const valueCombineOvrPot = (
	current: number,
	potential: number,
	age: number,
) => {
	// Coefficients influenced by analysis from nicidob:
	// "I built my little statistical OVR measure. Then grouped by age. And got the average sOVR for the following 4 player years. Then just did a regression tree from [pot, ovr] (if both exist) to see how to get that sOVR"
	if (age <= 19) {
		return 0.7 * potential + 0.3 * current;
	}

	if (age <= 20) {
		return 0.65 * potential + 0.35 * current;
	}

	if (age <= 21) {
		return 0.6 * potential + 0.4 * current;
	}

	if (age <= 22) {
		return 0.6 * potential + 0.4 * current;
	}

	if (age <= 23) {
		return 0.55 * potential + 0.45 * current;
	}

	if (age <= 24) {
		return 0.45 * potential + 0.55 * current;
	}

	if (age <= 25) {
		return 0.3 * potential + 0.7 * current;
	}

	if (age <= 26) {
		return 0.15 * potential + 0.85 * current;
	}

	if (age <= 27) {
		return 0.025 * potential + 0.95 * current;
	}

	if (age <= 28) {
		return 0.95 * current;
	}

	if (age <= 29) {
		return 0.94 * current;
	}

	if (age <= 30) {
		return 0.93 * current;
	}

	if (age <= 33) {
		return 0.92 * current;
	}

	if (age <= 38) {
		return 0.91 * current;
	}

	return 0.9 * current;
};

export default valueCombineOvrPot;
