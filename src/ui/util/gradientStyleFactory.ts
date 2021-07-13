const gradientStyleFactory = (
	low: number,
	mid1: number,
	mid2: number,
	high: number,
) => (x: number) => {
	let backgroundColor;
	if (x < low) {
		backgroundColor = "rgb(var(--gradient-base-danger))";
	} else if (x < mid1) {
		const fraction = (mid1 - x) / (mid1 - low);
		backgroundColor = `rgba(var(--gradient-base-danger), ${fraction})`;
	} else if (x > mid2) {
		const fraction = (x - mid2) / (high - mid2);
		backgroundColor = `rgba(var(--gradient-base-success), ${fraction})`;
	} else if (x > high) {
		backgroundColor = "rgb(var(--gradient-base-success))";
	}

	if (!backgroundColor) {
		return;
	}

	return {
		backgroundColor,
	};
};

export default gradientStyleFactory;
