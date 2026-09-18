import { assert, describe, test } from "vitest";
import processLiveGameEvents, {
	DEFAULT_SPORT_STATE,
	penaltySegments,
	type SportState,
} from "./processLiveGameEvents.football.tsx";

describe("penaltySegments", () => {
	test("no penalty: the whole bar is the play", () => {
		assert.deepStrictEqual(penaltySegments(10, 0), { play: 10, penalty: 0 });
		assert.deepStrictEqual(penaltySegments(-4, 0), { play: 4, penalty: 0 });
	});

	test("a foul added on after the play: the play, then the penalty", () => {
		// 12-yard run + 15-yard face mask from the end of the play
		assert.deepStrictEqual(penaltySegments(27, 15), { play: 12, penalty: 15 });
	});

	test("a foul that wipes out the play, or comes before the snap: all penalty", () => {
		assert.deepStrictEqual(penaltySegments(-10, -10), { play: 0, penalty: 10 });
		assert.deepStrictEqual(penaltySegments(15, 15), { play: 0, penalty: 15 });
	});

	test("mixed signs: all penalty when it decides the net, otherwise just the play", () => {
		// 12-yard gain, 15-yard personal foul on the offense from the end: net -3
		assert.deepStrictEqual(penaltySegments(-3, -15), { play: 0, penalty: 3 });
		// 20-yard gain, 5 taken back: net +15 is still the play's
		assert.deepStrictEqual(penaltySegments(15, -5), { play: 15, penalty: 0 });
		// Gain and penalty cancel out: nothing to draw
		assert.deepStrictEqual(penaltySegments(0, -5), { play: 0, penalty: 0 });
	});
});

describe("processLiveGameEvents penalty yards", () => {
	const team = (abbrev: string) =>
		({ abbrev, players: [], ptsQtrs: [], timeouts: 3 }) as any;

	// Feed every event through, the way the live game view does
	const run = (events: any[]) => {
		const sportState: SportState = structuredClone(DEFAULT_SPORT_STATE);
		const quarters: string[] = [];
		const boxScore = {
			gid: 1,
			quarter: "",
			quarterShort: "",
			numPeriods: 4,
			possession: undefined,
			teams: [team("AAA"), team("BBB")] as any,
			time: "",
			scoringSummary: [],
		};
		const queue = [...events];
		while (queue.length > 0) {
			processLiveGameEvents({
				events: queue,
				boxScore,
				overtimes: 0,
				quarters,
				sportState,
			});
		}
		return sportState;
	};

	const clock = (scrimmage: number) => ({
		type: "clock",
		awaitingKickoff: undefined,
		awaitingAfterTouchdown: false,
		clock: 10,
		down: 1,
		scrimmage,
		t: 0,
		toGo: 10,
	});
	const penalty = (fields: Record<string, unknown>) => ({
		type: "penalty",
		clock: 10,
		automaticFirstDown: false,
		halfDistanceToGoal: false,
		names: [],
		offsetStatus: undefined,
		placeOnOne: false,
		possessionAfter: 0,
		spotFoul: false,
		tackOn: false,
		...fields,
	});
	const handoffAndRun = (yds: number) => [
		{ type: "handoff", clock: 10, t: 0, names: ["QB", "RB"] },
		{
			type: "run",
			clock: 10,
			t: 0,
			names: ["RB"],
			yds,
			td: false,
			safety: false,
		},
	];

	test("a face mask added on after a 12-yard run", () => {
		const state = run([
			clock(30),
			...handoffAndRun(12),
			{ type: "flag", clock: 10 },
			penalty({
				decision: "accept",
				tackOn: true,
				scrimmageAfter: 57,
				penaltyName: "Face mask",
				t: 1,
				yds: 15,
			}),
			// Next snap: the play's yards are finalized from the new spot
			clock(57),
		]);
		const play = state.plays.at(-2)!;
		assert.strictEqual(play.yards, 27);
		assert.strictEqual(play.penaltyYards, 15);
	});

	test("holding wipes out a 20-yard completion", () => {
		const state = run([
			clock(30),
			{ type: "dropback", clock: 10, t: 0, names: ["QB"] },
			{
				type: "passComplete",
				clock: 10,
				t: 0,
				names: ["QB", "WR"],
				yds: 20,
				td: false,
				safety: false,
			},
			{ type: "flag", clock: 10 },
			penalty({
				decision: "accept",
				scrimmageAfter: 20,
				penaltyName: "Holding",
				t: 0,
				yds: 10,
			}),
		]);
		const play = state.plays.at(-1)!;
		assert.strictEqual(play.yards, -10);
		assert.strictEqual(play.penaltyYards, -10);
	});

	test("a declined flag leaves the play alone", () => {
		const state = run([
			clock(30),
			...handoffAndRun(12),
			{ type: "flag", clock: 10 },
			penalty({
				decision: "decline",
				scrimmageAfter: 35,
				penaltyName: "Offside",
				t: 1,
				yds: 5,
			}),
		]);
		const play = state.plays.at(-1)!;
		assert.strictEqual(play.yards, 12);
		assert.strictEqual(play.penaltyYards, 0);
	});

	test("a false start before the snap", () => {
		const state = run([
			clock(30),
			{ type: "flag", clock: 10 },
			penalty({
				decision: "accept",
				scrimmageAfter: 25,
				penaltyName: "False start",
				t: 0,
				yds: 5,
			}),
		]);
		const play = state.plays.at(-1)!;
		assert.strictEqual(play.yards, -5);
		assert.strictEqual(play.penaltyYards, -5);
	});
});
