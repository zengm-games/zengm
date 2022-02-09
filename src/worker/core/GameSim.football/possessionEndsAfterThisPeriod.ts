import isFirstPeriodAfterHalftime from "./isFirstPeriodAfterHalftime";

const possessionEndsAfterThisPeriod = (quarter: number, numPeriods: number) => {
	return (
		quarter >= numPeriods || isFirstPeriodAfterHalftime(quarter + 1, numPeriods)
	);
};

export default possessionEndsAfterThisPeriod;
