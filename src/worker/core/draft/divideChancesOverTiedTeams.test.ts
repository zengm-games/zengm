import assert from "assert";
import { loadTeamSeasons } from "./testHelpers";
import lotterySort from "./lotterySort";
import divideChancesOverTiedTeams from "./divideChancesOverTiedTeams";
import { idb } from "../../db";
import { g } from "../../util";
import testHelpers from "../../../test/helpers";

describe("worker/core/draft/divideChancesOverTiedTeams", () => {
	beforeAll(async () => {
		testHelpers.resetG();
		idb.league = testHelpers.mockIDBLeague();

		await loadTeamSeasons();
	});
	afterAll(() => {
		// @ts-ignore
		idb.league = undefined;
	});

	test("distribute combinations to teams with the same record", async () => {
		const teams = await idb.getCopies.teamsPlus({
			attrs: ["tid"],
			seasonAttrs: [
				"playoffRoundsWon",
				"cid",
				"did",
				"won",
				"lost",
				"tied",
				"otl",
				"winp",
				"pts",
				"wonDiv",
				"lostDiv",
				"tiedDiv",
				"otlDiv",
				"wonConf",
				"lostConf",
				"tiedConf",
				"otlConf",
			],
			stats: ["pts", "oppPts", "gp"],
			season: g.get("season"),
			addDummySeason: true,
			active: true,
		});
		const chances = [250, 199, 156, 119, 88, 63, 43, 28, 17, 11, 8, 7, 6, 5];

		// index instead of tid
		const sameRec = [
			[6, 7, 8],
			[10, 11, 12],
		];
		await lotterySort(teams);
		divideChancesOverTiedTeams(chances, teams, false);

		for (let i = 0; i < sameRec.length; i++) {
			const tids = sameRec[i];
			let value = 0;

			for (let j = 0; j < tids.length; j++) {
				if (value === 0) {
					value = chances[tids[j]];
				} else {
					assert.strictEqual(value, chances[tids[j]]);
				}
			}
		}

		// test if isFinal is true
		divideChancesOverTiedTeams(chances, teams, true);

		for (let i = 0; i < sameRec.length; i++) {
			const tids = sameRec[i];
			let value = 0;
			let maxIdx = -1;

			for (let j = tids.length - 1; j >= 0; j--) {
				if (value <= chances[tids[j]]) {
					value = chances[tids[j]];
					maxIdx = j;
				}
			}

			assert.strictEqual(maxIdx, 0);
		}
	});
});
