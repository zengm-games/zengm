const jumpBallWinnerStartsThisPeriodWithPossession = (
	period: number,
	numPeriods: number,
) => {
	// Overtime: doesn't matter, always starts with a jump ball
	if (period > numPeriods) {
		return true;
	}

	const periodRemainder = period % 2;

	// If numPeriods is odd, alternate
	if (numPeriods % 2 === 1) {
		return periodRemainder === 1;
	}

	// Special case for 2 periods
	if (period === 2 && numPeriods === 2) {
		return false;
	}

	// If numPeriods is even, alternate except for the one right after halftime, then repeat the one before halftime
	const firstPeriodAfterHalftime = numPeriods / 2 + 1;
	if (period < firstPeriodAfterHalftime) {
		return periodRemainder === 1;
	}
	return periodRemainder === 0;
};

export default jumpBallWinnerStartsThisPeriodWithPossession;
