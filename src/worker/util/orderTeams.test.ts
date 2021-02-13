import assert from "assert";
import testHelpers from "../../test/helpers";
import { idb } from "../db";
import g from "./g";
import helpers from "./helpers";
import range from "lodash/range";
import { breakTies } from "./orderTeams";

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
				season: 2020,
				tiebreakers: [tiebreaker, "random"],
			});

			const tids = teamsSorted.map(t => t.tid);
			const reasons = teamsSorted.map(t => t.tiebreakers?.[0]);

			assert.deepStrictEqual(tids, [2, 3, 0, 1]);
			assert.deepStrictEqual(reasons, [
				tiebreaker,
				tiebreaker,
				tiebreaker,
				undefined,
			]);
		});
	}

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
			season: 2020,
			tiebreakers: ["divWinner", "confRecordIfSame", "random"],
		});

		const tids = teamsSorted.map(t => t.tid);
		const reasons = teamsSorted.map(t => t.tiebreakers?.[0]);

		assert.deepStrictEqual(tids, [1, 2, 3, 0]);
		assert.deepStrictEqual(reasons, [
			"divWinner",
			"confRecordIfSame",
			"confRecordIfSame",
			undefined,
		]);
	});
});
