const avgAge = (
	players: {
		age: number;

		// undefined can happen with showRookies and no showNoStats in playersPlus, treated the same as no minutes played
		stats:
			| {
					min: number;
					gp: number;
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
		numerator +=
			p.age * p.stats.min * (__SPORT === "basketball" ? p.stats.gp : 1);
		denominator += p.stats.min * (__SPORT === "basketball" ? p.stats.gp : 1);
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
