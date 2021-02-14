import assert from "assert";
import helpers from "./helpers";
import range from "lodash/range";
import { breakTies } from "./orderTeams";
import type { HeadToHead } from "../../common/types";

const baseTeams = range(4).map(tid => ({
	tid,
	seasonAttrs: {
		winp: 0.5,
		won: 10,
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

			const teamsSorted = breakTies(teams, {
				addTiebreakersField: true,
				divisionWinners: new Set(),
				season: 2021,
				tiebreakers: [tiebreaker, "coinFlip"],
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

		const teamsSorted = breakTies(teams, {
			addTiebreakersField: true,
			divisionWinners: new Set(),
			headToHead,
			season: 2021,
			tiebreakers: ["commonOpponentsRecord", "coinFlip"],
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

		const teamsSorted = breakTies(teams, {
			addTiebreakersField: true,
			divisionWinners: new Set([1]),
			season: 2021,
			tiebreakers: ["divWinner", "confRecordIfSame", "coinFlip"],
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

		const teamsSorted = breakTies(teams, {
			addTiebreakersField: true,
			divisionWinners: new Set(),
			headToHead,
			season: 2021,
			tiebreakers: ["headToHeadRecord", "coinFlip"],
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

		const teamsSorted = breakTies(teams, {
			addTiebreakersField: true,
			divisionWinners: new Set([1]),
			season: 2021,
			tiebreakers: ["marginOfVictory", "coinFlip"],
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
});
