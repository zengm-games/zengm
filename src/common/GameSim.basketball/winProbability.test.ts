import { assert, describe, test } from "vitest";
import { getWinProbabilityBasketball } from "./winProbability.ts";

const base = {
	margin: 0,
	o: undefined as 0 | 1 | undefined,
	regulationSeconds: 48 * 60,
	secondsLeft: 24 * 60,
	sigma: 13.15,
	spread: 0,
};

const getProb = (
	args: Partial<Parameters<typeof getWinProbabilityBasketball>[0]> = {},
) => getWinProbabilityBasketball({ ...base, ...args });

describe("getWinProbabilityBasketball", () => {
	test("equal teams with neutral possession are even", () => {
		assert.closeTo(getProb(), 0.5, 1e-6);
		assert.closeTo(getProb({ secondsLeft: 120 }), 0.5, 1e-6);
		assert.closeTo(getProb({ secondsLeft: 20 }), 0.5, 1e-6);
		assert.closeTo(getProb({ secondsLeft: 0 }), 0.5, 1e-6);
	});

	test("rises monotonically with spread and margin", () => {
		let prevSpread = 0;
		for (const spread of [-15, -5, 0, 5, 15]) {
			const prob = getProb({ secondsLeft: 90, spread });
			assert.isAbove(prob, prevSpread);
			prevSpread = prob;
		}

		let prevMargin = 0;
		for (const margin of [-10, -3, -1, 0, 1, 3, 10]) {
			const prob = getProb({ margin, o: 0, secondsLeft: 45 });
			assert.isAbove(prob, prevMargin);
			prevMargin = prob;
		}
	});

	test("holding possession strictly improves win probability", () => {
		for (const secondsLeft of [1500, 163, 97, 23.6, 13.6, 2.2]) {
			const homeBall = getProb({ margin: 0, o: 0, secondsLeft });
			const neutral = getProb({ margin: 0, o: undefined, secondsLeft });
			const awayBall = getProb({ margin: 0, o: 1, secondsLeft });
			assert.isAbove(homeBall, neutral);
			assert.isAbove(neutral, awayBall);
		}
	});

	test("symmetry when swapping home and away teams", () => {
		for (const secondsLeft of [1200, 150, 90, 23.6, 13.6, 2.2]) {
			for (const margin of [-6, -2, -1, 0, 1, 2, 6]) {
				for (const spread of [-10, 0, 10]) {
					const pHome = getProb({ margin, o: 0, secondsLeft, spread });
					const pSwapped = getProb({
						margin: -margin,
						o: 1,
						secondsLeft,
						spread: -spread,
					});
					assert.closeTo(pHome + pSwapped, 1, 1e-6);
				}
			}
		}
	});

	test("smooth transition across the bulk/endgame boundary", () => {
		for (const margin of [-12, -5, -2, 0, 2, 5, 12]) {
			for (const spread of [-10, 0, 10]) {
				for (const o of [0, 1, undefined] as const) {
					const above = getProb({ margin, o, secondsLeft: 181, spread });
					const below = getProb({ margin, o, secondsLeft: 179, spread });
					assert.isBelow(Math.abs(above - below), 0.015);

					const blendAbove = getProb({ margin, o, secondsLeft: 121, spread });
					const blendBelow = getProb({ margin, o, secondsLeft: 119, spread });
					assert.isBelow(Math.abs(blendAbove - blendBelow), 0.015);
				}
			}
		}
	});

	test("issue #558 Game 7 endgame benchmarks match realistic possession-aware odds", () => {
		// 1-seed home favorite (spread ~ +11) vs 5-seed away team
		const spread = 11;

		// AE1: Q4 2:43, home +2, away has ball -> lower than old possession-blind 72%
		const q4_243 = getProb({ margin: 2, o: 1, secondsLeft: 163, spread });
		assert.isAbove(q4_243, 0.56);
		assert.isBelow(q4_243, 0.69);

		// AE2: Q4 23.6s, home -1, home has ball -> calibrated to BBGM (~44%, vs old 36%)
		const q4_236 = getProb({ margin: -1, o: 0, secondsLeft: 23.6, spread });
		assert.isAbove(q4_236, 0.42);
		assert.isBelow(q4_236, 0.6);

		// AE3: Q4 13.6s, home +1, away has ball -> much closer than old 70/30 (and even tighter for equal teams)
		const q4_136 = getProb({ margin: 1, o: 1, secondsLeft: 13.6, spread });
		assert.isAbove(q4_136, 0.52);
		assert.isBelow(q4_136, 0.67);
		assert.isBelow(
			getProb({ margin: 1, o: 1, secondsLeft: 13.6, spread: 0 }),
			0.63,
		);

		// AE4: Q4 2.2s, home -2, home about to inbound -> calibrated to BBGM (~16%, vs old 3%)
		const q4_22 = getProb({ margin: -2, o: 0, secondsLeft: 2.2, spread });
		assert.isAbove(q4_22, 0.12);
		assert.isBelow(q4_22, 0.35);
	});

	test("run-out-clock vs intentional-foul regime under 24 seconds (AE5)", () => {
		// Up 8 with 18s and ball -> run out clock (~100%)
		const up8 = getProb({ margin: 8, o: 0, secondsLeft: 18, spread: 0 });
		assert.closeTo(up8, 1, 1e-6);

		// Up 2 with 18s and ball -> intentional foul variance, high but well below 100%
		const up2 = getProb({ margin: 2, o: 0, secondsLeft: 18, spread: 0 });
		assert.isAbove(up2, 0.8);
		assert.isBelow(up2, 0.95);
	});

	test("free throws remaining and pending rebound sit in expected bounds", () => {
		// Down 1 with 10s left and shooting 2 FTs beats having a normal possession,
		// and trails already leading by 1 while opponent has ball
		const normalPoss = getProb({ margin: -1, o: 0, secondsLeft: 10 });
		const shooting2Ft = getProb({
			ftRemaining: 2,
			margin: -1,
			o: 0,
			secondsLeft: 10,
		});
		const up1OppBall = getProb({ margin: 1, o: 1, secondsLeft: 10 });
		assert.isAbove(shooting2Ft, normalPoss);
		assert.isAbove(up1OppBall, shooting2Ft);

		// Pending rebound after home miss lies strictly between home ORB and away DRB
		const homeOrb = getProb({ margin: 0, o: 0, secondsLeft: 15 });
		const awayDrb = getProb({ margin: 0, o: 1, secondsLeft: 15 });
		const pendingReb = getProb({
			awaitingRebound: true,
			margin: 0,
			o: 0,
			secondsLeft: 15,
		});
		assert.isBelow(pendingReb, homeOrb);
		assert.isAbove(pendingReb, awayDrb);
	});

	test("overtime tie resolution favors the stronger pre-game team", () => {
		assert.closeTo(
			getProb({ margin: 0, secondsLeft: 0, spread: 0 }),
			0.5,
			1e-6,
		);
		assert.isAbove(getProb({ margin: 0, secondsLeft: 0, spread: 10 }), 0.55);
		assert.isBelow(getProb({ margin: 0, secondsLeft: 0, spread: -10 }), 0.45);
		assert.strictEqual(getProb({ margin: 1, secondsLeft: 0, spread: -10 }), 1);
		assert.strictEqual(getProb({ margin: -1, secondsLeft: 0, spread: 10 }), 0);
	});

	test("handles extreme inputs and degenerate regulationSeconds without NaN", () => {
		for (const margin of [-50, -25, 0, 25, 50]) {
			for (const spread of [-30, 0, 30]) {
				for (const secondsLeft of [0, 0.5, 15, 180, 2880]) {
					const prob = getProb({ margin, o: 0, secondsLeft, spread });
					assert.isTrue(Number.isFinite(prob));
					assert.isAtLeast(prob, 0);
					assert.isAtMost(prob, 1);
				}
			}
		}

		assert.strictEqual(
			getProb({ margin: 3, regulationSeconds: 0, secondsLeft: 0 }),
			1,
		);
		assert.strictEqual(
			getProb({ margin: 0, regulationSeconds: 0, secondsLeft: 0 }),
			0.5,
		);
	});
});
