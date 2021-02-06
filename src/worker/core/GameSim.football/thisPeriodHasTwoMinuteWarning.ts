import possessionEndsAfterThisPeriod from "./possessionEndsAfterThisPeriod";

const thisPeriodHasTwoMinuteWarning = (quarter: number, numPeriods: number) => {
	return (
		possessionEndsAfterThisPeriod(quarter, numPeriods) || quarter >= numPeriods
	);
};

export default thisPeriodHasTwoMinuteWarning;
