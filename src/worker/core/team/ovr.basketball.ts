import { defaultGameAttributes, g } from "../../util";

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

	const numPlayersOnCourt = Object.hasOwn(g, "numPlayersOnCourt")
		? g.get("numPlayersOnCourt")
		: defaultGameAttributes.numPlayersOnCourt;
	let predictedMOV;
	if (numPlayersOnCourt >= 5) {
		predictedMOV =
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
	} else {
		predictedMOV = -k;

		let ratingsIndex = 0;
		for (let i = 0; i < numPlayersOnCourt; i++) {
			predictedMOV += a * Math.exp(b * i) * ratings[ratingsIndex];
			ratingsIndex += 1;
		}

		// Skip the coefficients of the normal starters who are now bench players
		for (let i = 5; i < 10; i++) {
			predictedMOV += a * Math.exp(b * i) * ratings[ratingsIndex];
			ratingsIndex += 1;
		}

		// Rough estimates to keep ovr on 0-100 scale
		predictedMOV += (60 * (5 - numPlayersOnCourt)) / 5;
	}

	if (rating) {
		// In this case, we're ultimately using the value to compute a rank or some other relative score, so we don't care about the scale
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
