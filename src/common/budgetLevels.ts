export const MAX_LEVEL = 100;

// At this level, the effect is 0
export const DEFAULT_LEVEL = 34;

// https://www.wolframalpha.com/input?i2d=true&i=1.1*Piecewise%5B%7B%7Btanh%5C%2840%29%5C%2840%293Divide%5Bx%2C100%5D-1%5C%2841%29%5C%2841%29%2Cx%3EDivide%5B100%2C3%5D%7D%2C%7B%5C%2840%293Divide%5Bx%2C100%5D-1%5C%2841%29%2Cx%3C%3DDivide%5B100%2C3%5D%7D%7D%5Dfrom+1+to+100
// Level should be the 3 year average, from getLevelLastThree
const levelToEffect = (level: number) => {
	if (Number.isNaN(level)) {
		return 0;
	}

	const x = (3 * (Math.round(level) - 1)) / (MAX_LEVEL - 1) - 1;

	// Overshoot to handle the sigmoid positive part never quite reaching 1, and probably no team drops all the way down to level 1
	const scale = 1.1;

	if (x < 0) {
		return scale * x;
	}

	return scale * Math.tanh(x);
};

export const levelToAmount = (level: number, salaryCap: number) => {
	return (
		Math.round(
			20 +
				(salaryCap / 90000) * 1330 +
				(900 * (salaryCap / 90000) * (Math.round(level) - 1)) / (MAX_LEVEL - 1),
		) * 10
	);
};

// Scale the output of levelToEffect for use in game - these functions are centralized here so they can be used in the UI too
export const facilitiesEffectMood = (level: number) => {
	const effect = levelToEffect(level);
	return 2 * effect;
};
export const facilitiesEffectAttendance = (level: number) => {
	const effect = levelToEffect(level);

	// 0 to 0.075
	return 0.0375 + 0.0375 * effect;
};
export const healthEffect = (level: number) => {
	const effect = levelToEffect(level);
	return 0.35 * effect;
};
export const coachingEffect = (level: number) => {
	const effect = levelToEffect(level);
	return 0.25 * effect;
};
export const scoutingEffect = (level: number) => {
	const effect = levelToEffect(level);

	// 1 to 8
	return (1 - effect) * 3.5 + 1;
};
