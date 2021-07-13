const getInjuryRate = (
	baseRate: number,
	age: number,
	playingThroughInjury?: boolean,
) => {
	// Modulate injuryRate by age - assume default is 26 yo, and increase/decrease by 3%
	let injuryRate = baseRate * 1.03 ** (Math.min(50, age) - 26);

	// 50% higher if playing through an injury
	if (playingThroughInjury) {
		injuryRate *= 1.5;
	}

	return injuryRate;
};

export default getInjuryRate;
