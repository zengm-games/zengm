import assert from "assert";
import helpers from "./helpers";
import range from "lodash-es/range";
import { breakTies } from "./orderTeams";
import type { HeadToHead } from "../../common/types";

const baseTeams = range(4).map(tid => ({
	tid,
	seasonAttrs: {
		winp: 0.5,
		pts: 20,
		won: 10,
		lost: 10,
		otl: 0,
		tied: 0,
		did: 0,
		cid: 0,
		wonDiv: 4,
		lostDiv: 4,
		otlDiv: 0,
		tiedDiv: 0,
		wonConf: 6,
		lostConf: 6,
		otlConf: 0,
		tiedConf: 0,
	},
	stats: {
		gp: 20,
		pts: 200,
		oppPts: 200,
	},
	tiebreaker: undefined as any,
}));

describe("worker/util/orderTeams/breakTies", () => {
	for (const type of ["conf", "div"] as const) {
		const tiebreaker = `${type}RecordIfSame` as const;

		test(tiebreaker, async () => {
			const teams = helpers.deepCopy(baseTeams);
			if (type === "conf") {
				teams[2].seasonAttrs.wonConf = 9;
				teams[2].seasonAttrs.lostConf = 3;
				teams[3].seasonAttrs.wonConf = 8;
				teams[3].seasonAttrs.lostConf = 4;
				teams[0].seasonAttrs.wonConf = 7;
				teams[0].seasonAttrs.lostConf = 5;
			} else {
				teams[2].seasonAttrs.wonDiv = 7;
				teams[2].seasonAttrs.lostDiv = 1;
				teams[3].seasonAttrs.wonDiv = 6;
				teams[3].seasonAttrs.lostDiv = 2;
				teams[0].seasonAttrs.wonDiv = 5;
				teams[0].seasonAttrs.lostDiv = 3;
			}

			const teamsSorted = breakTies(teams, teams, {
				addTiebreakersField: true,
				divisionWinners: new Set(),
				season: 2021,
				tiebreakers: [tiebreaker, "coinFlip"],
				usePts: false,
			});

			const tids = teamsSorted.map(t => t.tid);
			const reasons = teamsSorted.map(t => t.tiebreaker);

			assert.deepStrictEqual(tids, [2, 3, 0, 1]);
			assert.deepStrictEqual(reasons, [
				tiebreaker,
				tiebreaker,
				tiebreaker,
				undefined,
			]);
		});
	}

	test("commonOpponentsRecord", async () => {
		const teams = helpers.deepCopy(baseTeams);

		const headToHeadEntry = (won: number, lost: number) => ({
			won,
			lost,
			tied: 0,
			otw: 0,
			otl: 0,
			pts: 0,
			oppPts: 0,
		});

		const headToHead: HeadToHead = {
			season: 2021,
			regularSeason: {
				// The records against team 7 never matter, because the best and worst teams against the other common opponents never play team 7, so it never gets used in the tiebreaker
				0: {
					5: headToHeadEntry(0, 2),
					6: headToHeadEntry(2, 0),
					7: headToHeadEntry(100, 0),
				},
				1: {
					5: headToHeadEntry(0, 1),
					6: headToHeadEntry(2, 0),
					7: headToHeadEntry(0, 100),
				},
				2: {
					5: headToHeadEntry(0, 1),
					6: headToHeadEntry(0, 1),
				},
				3: {
					5: headToHeadEntry(2, 0),
					6: headToHeadEntry(2, 0),
				},
			},
			playoffs: {},
		};

		const teamsSorted = breakTies(teams, teams, {
			addTiebreakersField: true,
			divisionWinners: new Set(),
			headToHead,
			season: 2021,
			tiebreakers: ["commonOpponentsRecord", "coinFlip"],
			usePts: false,
		});

		const tids = teamsSorted.map(t => t.tid);
		const reasons = teamsSorted.map(t => t.tiebreaker);

		assert.deepStrictEqual(tids, [3, 1, 0, 2]);
		assert.deepStrictEqual(reasons, [
			"commonOpponentsRecord",
			"commonOpponentsRecord",
			"commonOpponentsRecord",
			undefined,
		]);
	});

	test("divWinner", async () => {
		const teams = helpers.deepCopy(baseTeams);
		teams[2].seasonAttrs.wonConf = 9;
		teams[2].seasonAttrs.lostConf = 3;
		teams[3].seasonAttrs.wonConf = 8;
		teams[3].seasonAttrs.lostConf = 4;
		teams[0].seasonAttrs.wonConf = 7;
		teams[0].seasonAttrs.lostConf = 5;

		const teamsSorted = breakTies(teams, teams, {
			addTiebreakersField: true,
			divisionWinners: new Set([1]),
			season: 2021,
			tiebreakers: ["divWinner", "confRecordIfSame", "coinFlip"],
			usePts: false,
		});

		const tids = teamsSorted.map(t => t.tid);
		const reasons = teamsSorted.map(t => t.tiebreaker);

		assert.deepStrictEqual(tids, [1, 2, 3, 0]);
		assert.deepStrictEqual(reasons, [
			"divWinner",
			"confRecordIfSame",
			"confRecordIfSame",
			undefined,
		]);
	});

	test("headToHeadRecord", async () => {
		const teams = helpers.deepCopy(baseTeams);

		const headToHeadEntry = (won: number, lost: number) => ({
			won,
			lost,
			tied: 0,
			otw: 0,
			otl: 0,
			pts: 0,
			oppPts: 0,
		});

		const headToHead: HeadToHead = {
			season: 2021,
			regularSeason: {
				0: {
					1: headToHeadEntry(0, 1),
					2: headToHeadEntry(0, 1),
					3: headToHeadEntry(0, 1),
				},
				1: {
					2: headToHeadEntry(0, 1),
					3: headToHeadEntry(0, 1),
				},
				2: {
					3: headToHeadEntry(0, 1),
				},
			},
			playoffs: {},
		};

		const teamsSorted = breakTies(teams, teams, {
			addTiebreakersField: true,
			divisionWinners: new Set(),
			headToHead,
			season: 2021,
			tiebreakers: ["headToHeadRecord", "coinFlip"],
			usePts: false,
		});

		const tids = teamsSorted.map(t => t.tid);
		const reasons = teamsSorted.map(t => t.tiebreaker);

		assert.deepStrictEqual(tids, [3, 2, 1, 0]);
		assert.deepStrictEqual(reasons, [
			"headToHeadRecord",
			"headToHeadRecord",
			"headToHeadRecord",
			undefined,
		]);
	});

	test("marginOfVictory", async () => {
		const teams = helpers.deepCopy(baseTeams);
		teams[2].stats.pts = 500;
		teams[3].stats.pts = 400;
		teams[1].stats.pts = 300;

		const teamsSorted = breakTies(teams, teams, {
			addTiebreakersField: true,
			divisionWinners: new Set([1]),
			season: 2021,
			tiebreakers: ["marginOfVictory", "coinFlip"],
			usePts: false,
		});

		const tids = teamsSorted.map(t => t.tid);
		const reasons = teamsSorted.map(t => t.tiebreaker);

		assert.deepStrictEqual(tids, [2, 3, 1, 0]);
		assert.deepStrictEqual(reasons, [
			"marginOfVictory",
			"marginOfVictory",
			"marginOfVictory",
			undefined,
		]);
	});

	test("strengthOfSchedule", async () => {
		const teams = helpers.deepCopy(baseTeams);
		teams[0].seasonAttrs.won = 5;
		teams[0].seasonAttrs.lost = 15;
		teams[1].seasonAttrs.won = 15;
		teams[1].seasonAttrs.lost = 5;

		const headToHeadEntry = (won: number, lost: number) => ({
			won,
			lost,
			tied: 0,
			otw: 0,
			otl: 0,
			pts: 0,
			oppPts: 0,
		});

		const headToHead: HeadToHead = {
			season: 2021,
			regularSeason: {
				// 2 and 3 are tied, but 3 played the better team more
				0: {
					2: headToHeadEntry(1, 1),
					3: headToHeadEntry(1, 0),
				},
				1: {
					2: headToHeadEntry(1, 0),
					3: headToHeadEntry(1, 1),
				},
			},
			playoffs: {},
		};

		const teamsSorted = breakTies([teams[2], teams[3]], teams, {
			addTiebreakersField: true,
			divisionWinners: new Set(),
			headToHead,
			season: 2021,
			tiebreakers: ["strengthOfSchedule", "coinFlip"],
			usePts: false,
		});

		const tids = teamsSorted.map(t => t.tid);
		const reasons = teamsSorted.map(t => t.tiebreaker);

		assert.deepStrictEqual(tids, [3, 2]);
		assert.deepStrictEqual(reasons, ["strengthOfSchedule", undefined]);
	});

	test("strengthOfVictory", async () => {
		const teams = helpers.deepCopy(baseTeams);
		teams[0].seasonAttrs.won = 5;
		teams[0].seasonAttrs.lost = 15;
		teams[1].seasonAttrs.won = 15;
		teams[1].seasonAttrs.lost = 5;

		const headToHeadEntry = (won: number, lost: number) => ({
			won,
			lost,
			tied: 0,
			otw: 0,
			otl: 0,
			pts: 0,
			oppPts: 0,
		});

		const headToHead: HeadToHead = {
			season: 2021,
			regularSeason: {
				// 2 and 3 are tied, 3 played the better team less, but beat it more
				0: {
					2: headToHeadEntry(1, 1),
					3: headToHeadEntry(100, 0),
				},
				1: {
					2: headToHeadEntry(1, 0),
					3: headToHeadEntry(1, 1),
				},
			},
			playoffs: {},
		};

		const teamsSorted = breakTies([teams[2], teams[3]], teams, {
			addTiebreakersField: true,
			divisionWinners: new Set(),
			headToHead,
			season: 2021,
			tiebreakers: ["strengthOfVictory", "coinFlip"],
			usePts: false,
		});

		const tids = teamsSorted.map(t => t.tid);
		const reasons = teamsSorted.map(t => t.tiebreaker);

		assert.deepStrictEqual(tids, [3, 2]);
		assert.deepStrictEqual(reasons, ["strengthOfVictory", undefined]);
	});
});
