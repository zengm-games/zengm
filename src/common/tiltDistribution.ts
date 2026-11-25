// Exponential tilt of a distribution over 0, 1, 2, ... points, to shift a team's distribution for how good it is while keeping the shape. theta of about the change in mean divided by the variance gives that change in mean.
export const tiltDistribution = (dist: readonly number[], theta: number) => {
	const weighted = dist.map((prob, pts) => prob * Math.exp(theta * pts));
	const total = weighted.reduce((sum, x) => sum + x, 0);
	return weighted.map((x) => x / total);
};
