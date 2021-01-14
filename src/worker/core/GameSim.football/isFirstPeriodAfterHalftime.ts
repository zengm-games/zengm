const isFirstPeriodAfterHalftime = (quarter: number, numPeriods: number) => {
	return numPeriods % 2 === 0 && quarter === numPeriods / 2 + 1;
};

export default isFirstPeriodAfterHalftime;
