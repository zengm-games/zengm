// Live win probability for basketball, combining the normal model from gamePrediction.ts (plus the value of having the ball) for most of the game with a discrete possession dynamic program in the closing minutes. The normal model fails in the final minutes, where possession, intentional fouling, running out the clock, rushed shots, and discrete 0/1/2/3 point scoring dominate.
// Constants below were measured by simulating 3,600 games across 6 random leagues (4 normal + 2 stacked-roster) with simGamesForPrediction({ recordStates: true }) in worker/core/debug.

import { getBasketballClockFactor, SHOT_CLOCK } from "./clockFactor.ts";
import { getWinProbability } from "../gamePrediction.ts";
import { tiltDistribution } from "../tiltDistribution.ts";
import type { TeamNum } from "../types.ts";

const DEFAULT_REGULATION_SECONDS = 48 * 60;
const DEFAULT_OVERTIME_SECONDS = 5 * 60;

// Discrete endgame DP runs up to ENDGAME_SECONDS (1-second grid) and blends smoothly into the normal model over [BLEND_START_SECONDS, ENDGAME_SECONDS]. The DP assumes final period strategy, so this assumes periods are at least ENDGAME_SECONDS long.
const ENDGAME_SECONDS = 180;
const BLEND_START_SECONDS = 120;
const MAX_MARGIN = 24;
const MARGIN_SIZE = 2 * MAX_MARGIN + 1;

// Half of expected points per possession, so flipping possession shifts expected margin by ~1.04 pts
const POSSESSION_VALUE = 0.52;

// Per-possession scoring PMF [P(0), P(1), P(2), P(3), P(4)] conditioned on possession ending, measured from BBGM simulations
const BASE_POSSESSION_PMF = [0.5342, 0.0316, 0.3021, 0.1315, 0.0006] as const;
// Probability the offense keeps the ball instead of the possession ending (ORB, non-shooting foul, OOB off the defense)
const POSSESSION_RETAINED_PROB = 0.1579;
// Offensive rebound rate after a missed field goal, and after a missed final free throw
const MISS_ORB_PROB = 0.26;
const FT_MISS_ORB_PROB = 0.12;
const BASE_FT_PROB = 0.77;
const POSSESSIONS_PER_TEAM_DEFAULT_GAME = 98;
// Backcourt turnover / steal / pre-bonus disruption rate during intentionalFoul possessions in GameSim.basketball
const INTENTIONAL_FOUL_TOV_PROB = 0.17;

type DurationKernel = readonly (readonly [seconds: number, weight: number])[];

// Possession duration kernels matching measured GameSim.basketball clock factors (norm ~12.0s, catchUp ~9.0s, maint ~15.2s, foul ~2.5s)
const NORMAL_DURATION_KERNEL: DurationKernel = [
	[7, 0.25],
	[12, 0.5],
	[17, 0.25],
];
const CATCH_UP_DURATION_KERNEL: DurationKernel = [
	[5, 0.25],
	[9, 0.5],
	[13, 0.25],
];
const MAINTAIN_LEAD_DURATION_KERNEL: DurationKernel = [
	[11, 0.25],
	[15, 0.5],
	[20, 0.25],
];
const ORB_DURATION_KERNEL: DurationKernel = [
	[4, 0.35],
	[7, 0.45],
	[10, 0.2],
];
const CATCH_UP_ORB_DURATION_KERNEL: DurationKernel = [
	[2, 0.35],
	[5, 0.45],
	[8, 0.2],
];
const INTENTIONAL_FOUL_DURATION_KERNEL: DurationKernel = [
	[1, 0.3],
	[2, 0.35],
	[4, 0.35],
];

const CACHE_MAX_ENTRIES = 64;

type EndgameTable = {
	// Flat Float64Array indexed by ((t * MARGIN_SIZE) + (margin + MAX_MARGIN)) * 2 + o
	values: Float64Array;
	ftProb: readonly [number, number];
	probWinOt: number;
};

const tableCache = new Map<string, EndgameTable>();

const getMean = (dist: readonly number[]) =>
	dist.reduce((sum, prob, pts) => sum + prob * pts, 0);

const getVariance = (dist: readonly number[]) => {
	const mean = getMean(dist);
	return dist.reduce((sum, prob, pts) => sum + prob * (pts - mean) ** 2, 0);
};

const BASE_POSSESSION_VARIANCE = getVariance(BASE_POSSESSION_PMF);

const idx = (t: number, m: number, o: TeamNum) =>
	(t * MARGIN_SIZE + (m + MAX_MARGIN)) * 2 + o;

// Probability a shot gets off before time expires
const getProbShot = (t: number) =>
	t <= 6 ? Math.min(1, (t / 8) ** (1 / 6)) : 1;

// Approximates the rushed shot penalty in GameSim.basketball (probMake *= sqrt(possessionLength / 8)), where the possession can't be longer than the time left
const getMakeScale = (t: number) => (t < 4 ? Math.sqrt(Math.max(1, t) / 6) : 1);

const getNormalModelProb = ({
	frac,
	margin,
	o,
	sigma,
	spread,
}: {
	frac: number;
	margin: number;
	o: TeamNum | undefined;
	sigma: number;
	spread: number;
}) =>
	getWinProbability({
		frac,
		margin,
		possessionValue:
			o === undefined ? 0 : o === 0 ? POSSESSION_VALUE : -POSSESSION_VALUE,
		sigma,
		spread,
	});

// Overtime is like the start of a game as long as one overtime period
const getProbWinOt = (
	spread: number,
	sigma: number,
	regulationSeconds: number,
) =>
	getWinProbability({
		frac: DEFAULT_OVERTIME_SECONDS / regulationSeconds,
		sigma,
		spread,
	});

const buildEndgameTable = (
	spread: number,
	sigma: number,
	regulationSeconds: number,
): EndgameTable => {
	const lengthScale = regulationSeconds / DEFAULT_REGULATION_SECONDS;
	const possessionsPerTeam = Math.max(
		10,
		POSSESSIONS_PER_TEAM_DEFAULT_GAME * lengthScale,
	);
	const deltaPerPossession = spread / (2 * possessionsPerTeam);
	const theta = Math.max(
		-0.35,
		Math.min(0.35, deltaPerPossession / BASE_POSSESSION_VARIANCE),
	);

	const pmfs: readonly [readonly number[], readonly number[]] = [
		tiltDistribution(BASE_POSSESSION_PMF, theta),
		tiltDistribution(BASE_POSSESSION_PMF, -theta),
	];

	// Slight FT% shift with team strength, kept bounded to realistic NBA range
	const ftShift = Math.max(-0.06, Math.min(0.06, deltaPerPossession * 0.15));
	const ftProb: readonly [number, number] = [
		BASE_FT_PROB + ftShift,
		BASE_FT_PROB - ftShift,
	];
	const ft2Pmfs = ftProb.map((p) => {
		const q = 1 - p;
		return [q * q, 2 * p * q, p * p] as const;
	});

	const probWinOt = getProbWinOt(spread, sigma, regulationSeconds);
	const values = new Float64Array((ENDGAME_SECONDS + 1) * MARGIN_SIZE * 2);

	const lookup = (t: number, m: number, o: TeamNum) => {
		if (m > MAX_MARGIN) {
			return 1;
		}
		if (m < -MAX_MARGIN) {
			return 0;
		}
		return values[idx(t, m, o)]!;
	};

	// Expected value after a shot ending the possession, which flips possession
	const getProbAfterShot = (
		tNext: number,
		m: number,
		o: TeamNum,
		makeScale: number,
	) => {
		const opp = (1 - o) as TeamNum;
		const sign = o === 0 ? 1 : -1;
		const pmf = pmfs[o];
		let expected = (1 - makeScale) * lookup(tNext, m, opp);
		for (let pts = 0; pts < pmf.length; pts++) {
			expected += makeScale * pmf[pts]! * lookup(tNext, m + sign * pts, opp);
		}
		return expected;
	};

	// Base case: t = 0
	for (let m = -MAX_MARGIN; m <= MAX_MARGIN; m++) {
		const p = m > 0 ? 1 : m < 0 ? 0 : probWinOt;
		values[idx(0, m, 0)] = p;
		values[idx(0, m, 1)] = p;
	}

	// Backward DP: t = 1..ENDGAME_SECONDS
	for (let t = 1; t <= ENDGAME_SECONDS; t++) {
		for (let m = -MAX_MARGIN; m <= MAX_MARGIN; m++) {
			for (let oNum = 0; oNum <= 1; oNum++) {
				const o = oNum as TeamNum;
				const opp = (1 - o) as TeamNum;
				const sign = o === 0 ? 1 : -1;
				const pExpired = lookup(0, m, o);

				// Same strategy as GameSim.basketball. The defense is basically always within 10 fouls of the bonus.
				const clockFactor = getBasketballClockFactor({
					finalPeriod: true,
					numFoulsUntilBonus: 0,
					pointDifferential: sign * m,
					t,
				});

				let pHome: number;

				if (clockFactor === "runOutClock") {
					pHome = o === 0 ? 1 : 0;
				} else if (clockFactor === "intentionalFoul") {
					// Defense fouls, unless the offense turns it over first (INTENTIONAL_FOUL_TOV_PROB)
					const ftPmf = ft2Pmfs[o]!;
					// Chance clock runs out while attempting to foul (mirrors t < 8 branch)
					const pClockExpires = t <= 1 ? 0.55 : t <= 3 ? 0.12 / t : 0;

					let pFoul = 0;
					for (const [dur, w] of INTENTIONAL_FOUL_DURATION_KERNEL) {
						const tNext = Math.max(0, t - dur);
						let expectedFts = 0;
						for (let pts = 0; pts <= 2; pts++) {
							expectedFts += ftPmf[pts]! * lookup(tNext, m + sign * pts, opp);
						}
						const pTov = lookup(tNext, m, opp);
						pFoul +=
							w *
							(INTENTIONAL_FOUL_TOV_PROB * pTov +
								(1 - INTENTIONAL_FOUL_TOV_PROB) * expectedFts);
					}
					pHome = pClockExpires * pExpired + (1 - pClockExpires) * pFoul;
				} else if (clockFactor === "holdForLastShot") {
					// After a last-shot attempt, defense has almost no time left (0..2s)
					const tAfter = t > SHOT_CLOCK ? t - SHOT_CLOCK : 0;
					const pShot = getProbShot(t);
					pHome =
						(1 - pShot) * pExpired +
						pShot * getProbAfterShot(tAfter, m, o, getMakeScale(t));
				} else {
					const isCatchUp = clockFactor === "catchUp";
					const durationKernel = isCatchUp
						? CATCH_UP_DURATION_KERNEL
						: clockFactor === "maintainLead"
							? MAINTAIN_LEAD_DURATION_KERNEL
							: NORMAL_DURATION_KERNEL;
					const makeScale = getMakeScale(t);

					let pFinish = 0;
					for (const [dur, w] of durationKernel) {
						pFinish +=
							w * getProbAfterShot(Math.max(0, t - dur), m, o, makeScale);
					}

					// Offense keeps possession in frontcourt
					const retainedKernel = isCatchUp
						? CATCH_UP_ORB_DURATION_KERNEL
						: ORB_DURATION_KERNEL;
					let pRetained = 0;
					for (const [dur, w] of retainedKernel) {
						pRetained += w * lookup(Math.max(0, t - dur), m, o);
					}

					// Under 4 seconds there isn't time for a separate full reset after ORB
					const retainedProb =
						t <= 4 ? POSSESSION_RETAINED_PROB * 0.25 : POSSESSION_RETAINED_PROB;
					const pPoss = (1 - retainedProb) * pFinish + retainedProb * pRetained;
					const pShot = getProbShot(t);
					pHome = (1 - pShot) * pExpired + pShot * pPoss;
				}

				values[idx(t, m, o)] = pHome;
			}
		}
	}

	return { values, ftProb, probWinOt };
};

const getEndgameTable = (
	spread: number,
	sigma: number,
	regulationSeconds: number,
) => {
	// Quantize to 0.25-point increments so cache stays compact with negligible accuracy loss
	const qSpread = Math.round(spread * 4) / 4;
	const qSigma = Math.round(sigma * 4) / 4;
	const qReg = Math.round(regulationSeconds);
	const key = `${qSpread}|${qSigma}|${qReg}`;

	const cached = tableCache.get(key);
	if (cached) {
		return cached;
	}

	const table = buildEndgameTable(qSpread, qSigma, qReg);
	if (tableCache.size >= CACHE_MAX_ENTRIES) {
		const oldestKey = tableCache.keys().next().value;
		if (oldestKey !== undefined) {
			tableCache.delete(oldestKey);
		}
	}
	tableCache.set(key, table);
	return table;
};

const queryEndgameTable = (
	table: EndgameTable,
	secondsLeft: number,
	margin: number,
	o: TeamNum,
) => {
	if (margin > MAX_MARGIN) {
		return 1;
	}
	if (margin < -MAX_MARGIN) {
		return 0;
	}

	const tClamped = Math.max(0, Math.min(ENDGAME_SECONDS, secondsLeft));
	const tLow = Math.floor(tClamped);
	const tHigh = Math.ceil(tClamped);
	const mInt = Math.round(margin);
	const pLow = table.values[idx(tLow, mInt, o)]!;
	if (tLow === tHigh) {
		return pLow;
	}
	const pHigh = table.values[idx(tHigh, mInt, o)]!;
	const alpha = tClamped - tLow;
	return pLow + alpha * (pHigh - pLow);
};

const evaluateBaseState = ({
	margin,
	o,
	regulationSeconds,
	secondsLeft,
	sigma,
	spread,
}: {
	margin: number;
	o: TeamNum | undefined;
	regulationSeconds: number;
	secondsLeft: number;
	sigma: number;
	spread: number;
}) => {
	if (secondsLeft <= 0) {
		if (margin > 0) {
			return 1;
		}
		if (margin < 0) {
			return 0;
		}
		return getProbWinOt(spread, sigma, regulationSeconds);
	}

	const frac = Math.min(1, secondsLeft / regulationSeconds);

	if (secondsLeft >= ENDGAME_SECONDS) {
		return getNormalModelProb({ frac, margin, o, sigma, spread });
	}

	const table = getEndgameTable(spread, sigma, regulationSeconds);
	const dpProb =
		o === undefined
			? 0.5 *
				(queryEndgameTable(table, secondsLeft, margin, 0) +
					queryEndgameTable(table, secondsLeft, margin, 1))
			: queryEndgameTable(table, secondsLeft, margin, o);

	if (secondsLeft <= BLEND_START_SECONDS) {
		return dpProb;
	}

	const normalModelProb = getNormalModelProb({
		frac,
		margin,
		o,
		sigma,
		spread,
	});
	const weight =
		(secondsLeft - BLEND_START_SECONDS) /
		(ENDGAME_SECONDS - BLEND_START_SECONDS);
	return dpProb + weight * (normalModelProb - dpProb);
};

/**
 * Live win probability that teams[0] (the home team) wins a basketball game.
 *
 * `o` is the team holding or about to inbound the ball (`undefined` if neutral/unknown).
 * `ftRemaining` is the number of free throws left in an active trip for team `o`.
 * `awaitingRebound` indicates a missed shot is live in the air with `o` as the shooting team.
 */
export const getWinProbabilityBasketball = ({
	awaitingRebound = false,
	ftRemaining = 0,
	margin,
	o,
	regulationSeconds = DEFAULT_REGULATION_SECONDS,
	secondsLeft,
	sigma,
	spread,
}: {
	awaitingRebound?: boolean;
	ftRemaining?: number;
	margin: number;
	o: TeamNum | undefined;
	regulationSeconds?: number;
	secondsLeft: number;
	sigma: number;
	spread: number;
}) => {
	if (regulationSeconds <= 0) {
		return margin > 0 ? 1 : margin < 0 ? 0 : 0.5;
	}

	const evalState = (m: number, nextO: TeamNum | undefined) =>
		evaluateBaseState({
			margin: m,
			o: nextO,
			regulationSeconds,
			secondsLeft,
			sigma,
			spread,
		});

	if (ftRemaining > 0 && o !== undefined) {
		const table = getEndgameTable(spread, sigma, regulationSeconds);
		const pMake = table.ftProb[o];
		const pMiss = 1 - pMake;
		const sign = o === 0 ? 1 : -1;
		const opp = (1 - o) as TeamNum;

		// Convolve the first (ftRemaining - 1) dead-ball free throws, then resolve the live final free throw
		let dist = [1];
		for (let i = 0; i < ftRemaining - 1; i++) {
			const next = Array<number>(dist.length + 1).fill(0);
			for (let k = 0; k < dist.length; k++) {
				next[k]! += dist[k]! * pMiss;
				next[k + 1]! += dist[k]! * pMake;
			}
			dist = next;
		}

		// Final FT: if made, opponent inbounds; if missed, rebound battle
		let total = 0;
		for (let k = 0; k < dist.length; k++) {
			const probBeforeLast = dist[k]!;
			const mBeforeLast = margin + sign * k;
			const pIfMade = evalState(mBeforeLast + sign, opp);
			const pIfMissed =
				FT_MISS_ORB_PROB * evalState(mBeforeLast, o) +
				(1 - FT_MISS_ORB_PROB) * evalState(mBeforeLast, opp);
			total += probBeforeLast * (pMake * pIfMade + pMiss * pIfMissed);
		}
		return total;
	}

	if (awaitingRebound && o !== undefined) {
		const opp = (1 - o) as TeamNum;
		return (
			MISS_ORB_PROB * evalState(margin, o) +
			(1 - MISS_ORB_PROB) * evalState(margin, opp)
		);
	}

	return evalState(margin, o);
};
