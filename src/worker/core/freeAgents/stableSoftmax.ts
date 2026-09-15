export type SoftmaxCache = {
	value: number;
	maxValue: number;
	param: number;
	weight: number;
};

// The caller supplies a scratch array, so reuse it for the resulting weights.
// Optional cache entries follow players as the candidate pool shrinks/reorders.
const stableSoftmax = (
	values: number[],
	param: number,
	cacheEntries?: { softmaxCache?: SoftmaxCache }[],
	cumulative = false,
) => {
	let maxValue = -Infinity;
	for (const value of values) {
		if (value > maxValue) {
			maxValue = value;
		}
	}

	let denominator = 0;
	for (let i = 0; i < values.length; i++) {
		// Divide rather than subtract, because sometimes maxX was so large that this was getting rounded to 0
		const value = values[i]!;
		const entry = cacheEntries?.[i];
		let cached = entry?.softmaxCache;
		if (
			cached !== undefined &&
			cached.value === value &&
			cached.maxValue === maxValue &&
			cached.param === param
		) {
			values[i] = cached.weight;
		} else {
			values[i] = Math.exp((param * value) / maxValue);
			if (entry !== undefined) {
				if (cached === undefined) {
					cached = { value, maxValue, param, weight: values[i]! };
					entry.softmaxCache = cached;
				} else {
					cached.value = value;
					cached.maxValue = maxValue;
					cached.param = param;
					cached.weight = values[i]!;
				}
			}
		}
		denominator += values[i]!;
	}

	const equalWeights = maxValue === 0 || denominator === 0;
	let total = 0;
	for (let i = 0; i < values.length; i++) {
		let weight = equalWeights ? 1 : values[i]! / denominator;
		if (cumulative) {
			// Match weighted choice's sanitizing, addition order, and boundaries.
			if (weight < 0 || Number.isNaN(weight)) {
				weight = Number.MIN_VALUE;
			}
			total = i === 0 ? weight : total + weight;
			values[i] = total;
		} else {
			values[i] = weight;
		}
	}
	return values;
};

export default stableSoftmax;
