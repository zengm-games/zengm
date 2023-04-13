import isSport from "./isSport";

const getPeriodName = (numPeriods: number, short?: boolean) => {
	if (isSport("baseball")) {
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

export default getPeriodName;
