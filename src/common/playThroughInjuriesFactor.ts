import bySport from "./bySport";

const PERFORMANCE_FRACTION_DECREASE_PER_DAY = bySport({
	basketball: 0.025,
	football: 0.05,
	hockey: 0.025,
});

const playThroughInjuriesFactor = (playThroughInjuries: number) => {
	return 1 - PERFORMANCE_FRACTION_DECREASE_PER_DAY * playThroughInjuries;
};

export default playThroughInjuriesFactor;
