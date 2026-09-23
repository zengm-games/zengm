export const getPeriodName = (numPeriods: number, short?: boolean) => {
	if (__SPORT === "baseball") {
		return short ? "Inn" : "inning";
	}

	if (numPeriods === 2) {
		return short ? "H" : "half";
	}

	if (numPeriods === 4) {
		return short ? "Q" : "quarter";
	}

	return short ? "P" : "period";
};
