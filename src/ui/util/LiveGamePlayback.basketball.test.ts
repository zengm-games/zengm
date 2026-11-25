import { assert, describe, test } from "vitest";
import { LiveGamePlaybackBasketball } from "./LiveGamePlayback.basketball.tsx";
import { isSportStateBasketball } from "./LiveGamePlayback.ts";

const makeTeam = (pids: number[]) => ({
	players: pids.map((pid) => ({
		drb: 0,
		inGame: true,
		injury: { gamesRemaining: 0, type: "Healthy" },
		name: `Player ${pid}`,
		orb: 0,
		pf: 0,
		pid,
		pm: 0,
	})),
	pts: 0,
	ptsQtrs: [] as number[],
	timeouts: 7,
});

const makePlayback = (events: any[], numPeriods = 4) => {
	const boxScore = {
		numPeriods,
		possession: undefined,
		quarter: "",
		quarterShort: "",
		teams: [makeTeam([1, 2]), makeTeam([3, 4])] as any,
		time: "12:00",
	};
	return {
		boxScore,
		playback: new LiveGamePlaybackBasketball(boxScore, events),
	};
};

describe("LiveGamePlaybackBasketball sportState", () => {
	test("starts neutral and is recognized by isSportStateBasketball", () => {
		const { playback } = makePlayback([]);
		assert.isTrue(isSportStateBasketball(playback.sportState));
		assert.deepStrictEqual(playback.sportState, {
			awaitingRebound: false,
			ftRemaining: 0,
			jumpBallWinner: undefined,
			o: undefined,
		});
	});

	test("flips next possession after made shot while keeping boxScore.possession unchanged", () => {
		const { boxScore, playback } = makePlayback([
			{ clock: 720, pid: 1, pid2: 3, t: 0, type: "jumpBall" },
			{ clock: 2.8, desperation: false, pid: 3, t: 1, type: "fgaTp" },
			{
				clock: 2.2,
				pid: 3,
				pidAst: 4,
				pidFoul: undefined,
				t: 1,
				type: "tp",
			},
			// Trailing event so playback.done does not clear boxScore.possession yet
			{ clock: 2.2, advancesBall: true, numLeft: 0, t: 0, type: "timeout" },
		]);

		playback.next(); // jumpBall
		assert.strictEqual(playback.sportState.o, 0);
		assert.strictEqual(playback.sportState.jumpBallWinner, 0);

		playback.next(); // fgaTp by team 1
		assert.strictEqual(playback.sportState.o, 1);

		playback.next(); // made 3 by team 1 -> team 0 about to inbound!
		assert.strictEqual(playback.sportState.o, 0);
		assert.strictEqual(playback.sportState.ftRemaining, 0);
		assert.strictEqual(playback.sportState.awaitingRebound, false);
		// UI dot continues highlighting the scoring team
		assert.strictEqual(boxScore.possession, 1);
	});

	test("tracks and-one, shooting fouls, free throws, and missed final FT rebound", () => {
		const { playback } = makePlayback([
			{
				clock: 60,
				pid: 1,
				pidAst: undefined,
				pidDefense: 3,
				pidFoul: 3,
				t: 0,
				type: "fgAtRimAndOne",
			},
			{ clock: 60, pid: 1, t: 0, type: "ft" },
			{ clock: 45, pid: 1, pidShooting: 3, t: 0, type: "pfFG" },
			{ clock: 45, pid: 3, t: 1, type: "ft" },
			{ clock: 45, pid: 3, t: 1, type: "missFt" },
			{ clock: 44, pid: 1, t: 0, type: "drb" },
			{ clock: 30, pid: 3, pidShooting: 1, t: 1, type: "pfTP" },
		]);

		playback.next(); // fgAtRimAndOne by team 0 -> 1 FT left for team 0
		assert.strictEqual(playback.sportState.o, 0);
		assert.strictEqual(playback.sportState.ftRemaining, 1);

		playback.next(); // made bonus FT -> flips to team 1
		assert.strictEqual(playback.sportState.o, 1);
		assert.strictEqual(playback.sportState.ftRemaining, 0);

		playback.next(); // pfFG on team 0 -> 2 FTs for team 1
		assert.strictEqual(playback.sportState.o, 1);
		assert.strictEqual(playback.sportState.ftRemaining, 2);

		playback.next(); // first FT made -> still team 1 with 1 FT left
		assert.strictEqual(playback.sportState.o, 1);
		assert.strictEqual(playback.sportState.ftRemaining, 1);
		assert.strictEqual(playback.sportState.awaitingRebound, false);

		playback.next(); // second FT missed -> rebound pending with team 1 as shooter
		assert.strictEqual(playback.sportState.o, 1);
		assert.strictEqual(playback.sportState.ftRemaining, 0);
		assert.strictEqual(playback.sportState.awaitingRebound, true);

		playback.next(); // drb by team 0 -> clears rebound, team 0 has ball
		assert.strictEqual(playback.sportState.o, 0);
		assert.strictEqual(playback.sportState.awaitingRebound, false);

		playback.next(); // pfTP on team 1 -> 3 FTs for team 0
		assert.strictEqual(playback.sportState.o, 0);
		assert.strictEqual(playback.sportState.ftRemaining, 3);
	});

	test("tracks misses, blocks (defender polarity), rebounds, turnovers, steals, OOB, and timeouts", () => {
		const { playback } = makePlayback([
			{ clock: 100, pid: 1, t: 0, type: "missLowPost" },
			{ clock: 99, pid: 1, t: 0, type: "orb" },
			{ clock: 95, pid: 3, t: 1, type: "blkAtRim" },
			{ clock: 94, pid: 3, t: 1, type: "drb" },
			{ clock: 88, outOfBounds: false, pid: 3, t: 1, type: "tov" },
			{ clock: 80, outOfBounds: false, pid: 3, pidTov: 1, t: 1, type: "stl" },
			{ clock: 75, on: "defense", t: 0, type: "outOfBounds" },
			{ clock: 70, on: "offense", t: 1, type: "outOfBounds" },
			{ clock: 65, advancesBall: true, numLeft: 2, t: 0, type: "timeout" },
			{ clock: 60, pid: 3, t: 1, type: "pfNonShooting" },
		]);

		playback.next(); // missLowPost by team 0
		assert.strictEqual(playback.sportState.o, 0);
		assert.strictEqual(playback.sportState.awaitingRebound, true);

		playback.next(); // orb by team 0
		assert.strictEqual(playback.sportState.o, 0);
		assert.strictEqual(playback.sportState.awaitingRebound, false);

		playback.next(); // blkAtRim by defender team 1 -> shooter is team 0!
		assert.strictEqual(playback.sportState.o, 0);
		assert.strictEqual(playback.sportState.awaitingRebound, true);

		playback.next(); // drb by team 1
		assert.strictEqual(playback.sportState.o, 1);
		assert.strictEqual(playback.sportState.awaitingRebound, false);

		playback.next(); // tov by team 1 -> team 0 ball
		assert.strictEqual(playback.sportState.o, 0);

		playback.next(); // stl by team 1 -> team 1 ball
		assert.strictEqual(playback.sportState.o, 1);

		playback.next(); // outOfBounds last touched by defense (team 0) -> team 1 retains
		assert.strictEqual(playback.sportState.o, 1);

		playback.next(); // outOfBounds last touched by offense (team 1) -> team 0 ball
		assert.strictEqual(playback.sportState.o, 0);

		playback.next(); // timeout by team 0 -> team 0 ball
		assert.strictEqual(playback.sportState.o, 0);

		playback.next(); // pfNonShooting on team 1 -> team 0 keeps ball
		assert.strictEqual(playback.sportState.o, 0);
	});

	test("sets Q2-Q4 starting possession from Q1 jump ball and resets for OT / endOfPeriod", () => {
		const { playback } = makePlayback([
			{ clock: 720, pid: 1, pid2: 3, t: 0, type: "jumpBall" },
			{ clock: 0, reason: "noShot", t: 0, type: "endOfPeriod" },
			{ clock: 720, period: 2, type: "period" },
			{ clock: 720, period: 3, type: "period" },
			{ clock: 720, period: 4, type: "period" },
			{ clock: 300, period: 5, type: "overtime" },
			{ clock: 300, pid: 3, pid2: 1, t: 1, type: "jumpBall" },
		]);

		playback.next(); // Q1 jumpBall won by team 0
		assert.strictEqual(playback.sportState.o, 0);
		assert.strictEqual(playback.sportState.jumpBallWinner, 0);

		playback.next(); // endOfPeriod -> neutral
		assert.isUndefined(playback.sportState.o);

		playback.next(); // Q2 -> team 1 starts
		assert.strictEqual(playback.sportState.o, 1);

		playback.next(); // Q3 -> team 1 starts (after halftime repeat)
		assert.strictEqual(playback.sportState.o, 1);

		playback.next(); // Q4 -> team 0 starts
		assert.strictEqual(playback.sportState.o, 0);

		playback.next(); // OT -> neutral until jump ball
		assert.isUndefined(playback.sportState.o);

		playback.next(); // OT jump ball won by team 1 (doesn't overwrite Q1 winner)
		assert.strictEqual(playback.sportState.o, 1);
		assert.strictEqual(playback.sportState.jumpBallWinner, 0);
	});
});
