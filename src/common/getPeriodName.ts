const getPeriodName = (numPeriods: number) => {
	if (numPeriods === 2) {
		return "half";
	}

	if (numPeriods === 4) {
		return "quarter";
	}

	return "period";
};

export default getPeriodName;
