const ovr = (
	players: {
		ratings: {
			ovr: number;
			pos: string;
		};
	}[],
	{
		playoffs = false,
		rating,
	}: {
		playoffs?: boolean;
		rating?: string;
	},
) => {
	const ratings = players
		.slice()
		// Sort first, so non-ovr ratings are based on the top ovr players
		.sort((a, b) => b.ratings.ovr - a.ratings.ovr)
		.map(p => {
			if (rating === undefined) {
				return p.ratings.ovr;
			}

			const val = (p.ratings as any)[rating];
			if (typeof val === "number") {
				return val;
			}

			throw new Error(`Rating not found for "${rating}"`);
		});

	while (ratings.length < 10) {
		ratings.push(0);
	}

	// See analysis/team-ovr-basketball
	let a, b, k;
	if (playoffs) {
		a = 0.6388;
		b = -0.2245;
		k = 157.43;
	} else {
		a = 0.3334;
		b = -0.1609;
		k = 102.98;
	}
	const predictedMOV =
		-k +
		a * Math.exp(b * 0) * ratings[0] +
		a * Math.exp(b * 1) * ratings[1] +
		a * Math.exp(b * 2) * ratings[2] +
		a * Math.exp(b * 3) * ratings[3] +
		a * Math.exp(b * 4) * ratings[4] +
		a * Math.exp(b * 5) * ratings[5] +
		a * Math.exp(b * 6) * ratings[6] +
		a * Math.exp(b * 7) * ratings[7] +
		a * Math.exp(b * 8) * ratings[8] +
		a * Math.exp(b * 9) * ratings[9];

	if (rating) {
		// In this case, we're ultimately using the value to compute a rank, so we don't care about the scale. And bounding the scale to be positive below makes it often 0.
		return predictedMOV;
	}

	// Translate from -15/15 to 0/100 scale
	let rawOVR = (predictedMOV * 50) / 15 + 50;

	if (playoffs) {
		rawOVR -= 40;
	}

	return Math.round(rawOVR);
};

export default ovr;
