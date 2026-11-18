// Sort values for the assets in a trade offer

export const pickScore = (
	picks: {
		round: number;
		pick: number;
	}[],
) => {
	let score = 0;
	for (const { round, pick } of picks) {
		// Assume roughly 30 teams
		const imputedPick = pick > 0 ? pick : 15;

		// Assume no more than 20 rounds or 100 teams. Exponent is tuned so that you need about 4 second round picks to equal 1 first round pick.
		score += (20 - round + (1 - imputedPick / 100)) ** 25;
	}
	return score;
};

export const playerScore = (
	players: {
		ratings: {
			ovr: number;
			pot: number;
		};
	}[],
) => {
	let score = 0;
	for (const p of players) {
		score += (p.ratings.pot + p.ratings.ovr) ** 2;
	}
	return score;
};
