import gradientStyleFactory from "../../util/gradientStyleFactory.ts";

const calculateStatistics = (values: number[]) => {
	let sum = 0;
	for (const value of values) {
		sum += value;
	}
	const mean = sum / values.length;

	let numerator = 0;
	for (const value of values) {
		const diff = value - mean;
		numerator += diff * diff;
	}

	const variance = numerator / values.length;
	return {
		mean,
		stddev: Math.sqrt(variance),
	};
};

export const getGradientStyle = (values: number[]) => {
	const statistics = calculateStatistics(values);
	const mean = statistics.mean;

	// Since we're showing integer values (number of games) might as well make this at least 1, otherwise it's trying to find things that don't exist
	const stddev = Math.min(1, statistics.stddev);

	return gradientStyleFactory(
		mean - 2 * stddev,
		mean - stddev,
		mean + stddev,
		mean + 2 * stddev,
	);
};
