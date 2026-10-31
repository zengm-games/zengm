import { assert, test } from "vitest";
import {
	getWinModelInputs,
	getWinProbability,
	roundWinPercents,
} from "../../common/winProbability.ts";
import { getLiveWinp } from "./getLiveWinp.ts";

const makeBoxScore = ({
	pts = [0, 0],
	period = 2,
	time = "6:00",
	...rest
}: {
	pts?: [number, number];
	period?: number;
	time?: string;
	[key: string]: unknown;
} = {}) => ({
	numPeriods: 4,
	teams: [0, 1].map((i) => ({
		ovr: 55,
		pts: pts[i],
		ptsQtrs: Array(period).fill(0),
		tid: i,
	})),
	time,
	...rest,
});

const getProb = (boxScore: any) =>
	getLiveWinp({
		boxScore,
		homeCourtAdvantage: 1,
		quarterLength: 12,
		sportState: undefined,
	});

test("before the first play equals the pre-game value", () => {
	const result = getProb(makeBoxScore({ period: 0, time: "12:00" }));
	assert.strictEqual(
		result?.prob,
		getWinProbability(
			getWinModelInputs({
				homeCourtAdvantage: 1,
				neutral: false,
				numPeriods: 4,
				ovrs: [55, 55],
				quarterLength: 12,
			}),
		),
	);
});

test("a growing lead raises the leader's value", () => {
	let prev = 0;
	for (const lead of [0, 5, 10, 20]) {
		const prob = getProb(makeBoxScore({ pts: [50 + lead, 50] }))!.prob;
		assert.isAbove(prob, prev);
		prev = prob;
	}
});

test("up 40 at 0:00 without gameOver stays clamped to 99", () => {
	const result = getProb(
		makeBoxScore({ period: 4, pts: [120, 80], time: "0:00" }),
	)!;
	assert.deepEqual(
		roundWinPercents(result.prob, result.resolved).percents,
		[99, 1],
	);
});

test("reads the sub-minute clock", () => {
	const late = getProb(
		makeBoxScore({ period: 4, pts: [100, 98], time: "4.5" }),
	)!;
	const earlier = getProb(
		makeBoxScore({ period: 4, pts: [100, 98], time: "4:00" }),
	)!;
	assert.isAbove(late.prob, earlier.prob);
});

test("tied in overtime is near even and not NaN", () => {
	for (const time of ["5:00", "0:00"]) {
		const { prob } = getProb(
			makeBoxScore({ overtime: "(OT)", period: 5, pts: [100, 100], time }),
		)!;
		assert.closeTo(prob, 0.5, 0.1);
	}
});

test("uses points to target and ignores the clock in an Elam ending", () => {
	const far = getProb(
		makeBoxScore({
			elamTarget: 120,
			period: 4,
			pts: [100, 95],
			time: "Infinity:NaN",
		}),
	)!;
	const near = getProb(
		makeBoxScore({
			elamTarget: 120,
			period: 4,
			pts: [118, 113],
			time: "Infinity:NaN",
		}),
	)!;
	assert.isTrue(Number.isFinite(far.prob));
	assert.isTrue(Number.isFinite(near.prob));
	assert.isAbove(near.prob, far.prob);
	assert.isBelow(near.prob, 1);
});

test("a shootout stays within 5..95 and moves with sPts", () => {
	const makeShootout = (sPts: [number, number]) => {
		const boxScore = makeBoxScore({ period: 5, shootout: true, time: "0:00" });
		for (const [i, t] of boxScore.teams.entries()) {
			(t as any).sPts = sPts[i];
		}
		return getProb(boxScore)!.prob;
	};

	assert.closeTo(makeShootout([0, 0]), 0.5, 1e-9);
	assert.isAbove(makeShootout([2, 1]), makeShootout([1, 1]));
	assert.strictEqual(makeShootout([20, 0]), 0.95);
	assert.strictEqual(makeShootout([0, 20]), 0.05);
});

test("gameOver is decided by pts, then sPts, then ties", () => {
	assert.deepEqual(getProb(makeBoxScore({ gameOver: true, pts: [90, 80] })), {
		prob: 1,
		resolved: true,
		tied: false,
	});
	assert.deepEqual(getProb(makeBoxScore({ gameOver: true, pts: [80, 90] })), {
		prob: 0,
		resolved: true,
		tied: false,
	});

	const shootout = makeBoxScore({ gameOver: true, pts: [80, 80] });
	(shootout.teams[0] as any).sPts = 1;
	(shootout.teams[1] as any).sPts = 3;
	assert.deepEqual(getProb(shootout), {
		prob: 0,
		resolved: true,
		tied: false,
	});

	assert.deepEqual(getProb(makeBoxScore({ gameOver: true, pts: [80, 80] })), {
		prob: 0.5,
		resolved: true,
		tied: true,
	});
});

test("missing ovr returns undefined", () => {
	const boxScore = makeBoxScore();
	delete (boxScore.teams[1] as any).ovr;
	assert.isUndefined(getProb(boxScore));
});

test("ignores the known result", () => {
	const home = { name: "home", pts: 100, tid: 0 };
	const away = { name: "away", pts: 90, tid: 1 };
	assert.deepEqual(
		getProb(makeBoxScore({ lost: home, won: away })),
		getProb(makeBoxScore({ lost: away, won: home })),
	);
});

test("an All-Star game has no home edge", () => {
	const boxScore = makeBoxScore({ period: 0, time: "12:00" });
	boxScore.teams[0]!.tid = -1;
	boxScore.teams[1]!.tid = -2;
	assert.closeTo(getProb(boxScore)!.prob, 0.5, 1e-6);
});

test("quarterLength of 0 is even", () => {
	const { prob } = getLiveWinp({
		boxScore: makeBoxScore({ pts: [5, 0], time: "0:00" }),
		homeCourtAdvantage: 1,
		quarterLength: 0,
		sportState: undefined,
	})!;
	assert.strictEqual(prob, 0.5);
});
