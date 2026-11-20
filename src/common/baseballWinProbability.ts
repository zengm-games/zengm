// Live win probability for baseball, from the distribution of runs left in each half inning. This works better than the normal distribution used for other sports, because most innings are scoreless and runs are scored in bunches, so a small lead late in the game is safer than a normal distribution says.

// Runs scored in the rest of a half inning, by outs and then by bases (a bitmask where 1 is first base, 2 is second, 4 is third). p0 is the probability of no runs. Measured by simulating games with simGamesForPrediction (in worker/core/debug) with recordStates, in 6 random leagues.
const RUNS_LEFT_IN_HALF_INNING: { p0: number; mean: number }[][] = [
	[
		{ p0: 0.788, mean: 0.384 },
		{ p0: 0.68, mean: 0.685 },
		{ p0: 0.543, mean: 0.849 },
		{ p0: 0.486, mean: 1.191 },
		{ p0: 0.357, mean: 1.034 },
		{ p0: 0.364, mean: 1.295 },
		{ p0: 0.333, mean: 1.544 },
		{ p0: 0.242, mean: 1.938 },
	],
	[
		{ p0: 0.869, mean: 0.215 },
		{ p0: 0.796, mean: 0.41 },
		{ p0: 0.668, mean: 0.559 },
		{ p0: 0.638, mean: 0.776 },
		{ p0: 0.504, mean: 0.74 },
		{ p0: 0.532, mean: 0.876 },
		{ p0: 0.484, mean: 1.109 },
		{ p0: 0.424, mean: 1.382 },
	],
	[
		{ p0: 0.942, mean: 0.086 },
		{ p0: 0.903, mean: 0.184 },
		{ p0: 0.819, mean: 0.272 },
		{ p0: 0.796, mean: 0.388 },
		{ p0: 0.748, mean: 0.354 },
		{ p0: 0.746, mean: 0.439 },
		{ p0: 0.737, mean: 0.549 },
		{ p0: 0.667, mean: 0.74 },
	],
];

const NUM_OUTS_PER_INNING = 3;

// More runs than this in what's left of a game is rare enough to ignore
const MAX_RUNS = 20;

// Distributions are arrays where index is the number of runs

// Zero inflated geometric distribution with the given probability of 0 and mean. This matches the measured distributions about as well as using them directly.
const getDistribution = ({ p0, mean }: { p0: number; mean: number }) => {
	const rho = Math.max(0, 1 - (1 - p0) / mean);
	const dist = [p0];
	for (let runs = 1; runs <= MAX_RUNS; runs++) {
		dist.push((1 - p0) * (1 - rho) * rho ** (runs - 1));
	}
	return dist;
};

const SCORELESS: number[] = [1];

const getMean = (dist: number[]) =>
	dist.reduce((sum, prob, runs) => sum + prob * runs, 0);

const getVariance = (dist: number[]) => {
	const mean = getMean(dist);
	return dist.reduce((sum, prob, runs) => sum + prob * (runs - mean) ** 2, 0);
};

// Exponential tilt, to shift a team's distribution for how good it is while keeping the shape. theta of about the change in mean divided by the variance gives that change in mean.
const tilt = (dist: number[], theta: number) => {
	const weighted = dist.map((prob, runs) => prob * Math.exp(theta * runs));
	const total = weighted.reduce((sum, x) => sum + x, 0);
	return weighted.map((x) => x / total);
};

const convolve = (a: number[], b: number[]) => {
	const out: number[] = Array(
		Math.min(a.length + b.length - 1, 2 * MAX_RUNS + 1),
	).fill(0);
	for (const [i, probA] of a.entries()) {
		for (const [j, probB] of b.entries()) {
			if (i + j < out.length) {
				out[i + j]! += probA * probB;
			}
		}
	}
	return out;
};

const repeat = (dist: number[], times: number) => {
	let out = SCORELESS;
	for (let i = 0; i < times; i++) {
		out = convolve(out, dist);
	}
	return out;
};

const FULL_HALF_INNING = getDistribution(RUNS_LEFT_IN_HALF_INNING[0]![0]!);
const FULL_HALF_INNING_VARIANCE = getVariance(FULL_HALF_INNING);

/**
 * Probability that teams[0], the home team, wins.
 *
 * o is the team batting and inning is its current inning, starting at 1. outs can be 3 after the last out of a half inning, before the next one starts.
 *
 * spread is the pre-game spread from getGamePrediction, which is spread evenly over every half inning to adjust each team's runs.
 */
export const getWinProbabilityBaseball = ({
	basesOccupied,
	inning,
	margin,
	numInnings,
	o,
	outs,
	spread,
}: {
	basesOccupied: readonly [boolean, boolean, boolean];
	inning: number;
	margin: number;
	numInnings: number;
	o: 0 | 1;
	outs: number;
	spread: number;
}) => {
	const delta = numInnings > 0 ? spread / (2 * numInnings) : 0;
	const thetas = [
		delta / FULL_HALF_INNING_VARIANCE,
		-delta / FULL_HALF_INNING_VARIANCE,
	] as const;
	const fullHalfInnings = [
		tilt(FULL_HALF_INNING, thetas[0]),
		tilt(FULL_HALF_INNING, thetas[1]),
	] as const;

	// Any extra inning could be the last
	const lastInning = Math.max(numInnings, inning);

	// Full half innings left after the current one
	const numHalfInningsLeft =
		o === 1
			? [lastInning - inning + 1, lastInning - inning]
			: [lastInning - inning, lastInning - inning];

	const bases = basesOccupied.reduce(
		(mask, occupied, i) => (occupied ? mask | (1 << i) : mask),
		0,
	);
	const restOfHalfInning =
		outs >= NUM_OUTS_PER_INNING
			? SCORELESS
			: tilt(
					getDistribution(RUNS_LEFT_IN_HALF_INNING[outs]![bases]!),
					thetas[o],
				);

	const runsLeft = [0, 1].map((t) => {
		const dist = repeat(fullHalfInnings[t]!, numHalfInningsLeft[t]!);
		return t === o ? convolve(dist, restOfHalfInning) : dist;
	}) as [number[], number[]];

	// Probability of winning or being tied at the end of regulation. It doesn't matter that the home team doesn't finish the last inning when it takes the lead, because that doesn't change who wins.
	let probWin = 0;
	let probTie = 0;
	for (const [homeRuns, probHome] of runsLeft[0].entries()) {
		for (const [awayRuns, probAway] of runsLeft[1].entries()) {
			const finalMargin = margin + homeRuns - awayRuns;
			if (finalMargin > 0) {
				probWin += probHome * probAway;
			} else if (finalMargin === 0) {
				probTie += probHome * probAway;
			}
		}
	}

	return probWin + probTie * getProbWinExtraInnings(fullHalfInnings);
};

// Extra innings continue until one team outscores the other in an inning
const getProbWinExtraInnings = (
	fullHalfInnings: readonly [number[], number[]],
) => {
	let probWinInning = 0;
	let probLoseInning = 0;
	for (const [homeRuns, probHome] of fullHalfInnings[0].entries()) {
		for (const [awayRuns, probAway] of fullHalfInnings[1].entries()) {
			if (homeRuns > awayRuns) {
				probWinInning += probHome * probAway;
			} else if (homeRuns < awayRuns) {
				probLoseInning += probHome * probAway;
			}
		}
	}

	return probWinInning / (probWinInning + probLoseInning);
};
