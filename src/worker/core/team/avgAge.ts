const avgAge = (
	players: {
		age: number;

		// undefined can happen with showRookies and no showNoStats in playersPlus, treated the same as no minutes played
		stats:
			| {
					min: number | undefined;
					gp: number | undefined;
			  }
			| undefined;
	}[],
) => {
	if (players.length === 0) {
		return;
	}

	let numerator = 0;
	let denominator = 0;

	for (const p of players) {
		if (!p.stats) {
			continue;
		}
		// min and gp can be missing in historical data, treated the same as no minutes played
		const weight =
			(p.stats.min ?? 0) * (__SPORT === "basketball" ? (p.stats.gp ?? 0) : 1);
		numerator += p.age * weight;
		denominator += weight;
	}

	// Just do raw average if no mins
	if (numerator === 0 && denominator === 0) {
		for (const p of players) {
			numerator += p.age;
		}
		denominator = players.length;
	}

	return numerator / denominator;
};

export default avgAge;
