export const getCumulativeWeights = (
	players: { softmaxValue: number }[],
	param: number,
) => {
	const weights: number[] = [];
	weights.length = players.length;

	let maxValue = -Infinity;
	for (const p of players) {
		if (p.softmaxValue > maxValue) {
			maxValue = p.softmaxValue;
		}
	}

	let denominator = 0;
	for (let i = 0; i < players.length; i++) {
		// Preserve the division used by stableSoftmax for very large values
		const weight = Math.exp((param * players[i]!.softmaxValue) / maxValue);
		weights[i] = weight;
		denominator += weight;
	}

	const equalWeights = maxValue === 0 || denominator === 0;
	let total = 0;
	for (let i = 0; i < weights.length; i++) {
		const weight = equalWeights ? 1 : weights[i]! / denominator;
		total += weight;
		weights[i] = total;
	}
	return weights;
};
