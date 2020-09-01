import assert from "assert";
import { loadTeamSeasons } from "./testHelpers";
import lotterySort from "./lotterySort";
import updateChances from "./updateChances";
import { idb } from "../../db";
import { g } from "../../util";

describe("worker/core/draft/updateChances", () => {
	beforeAll(loadTeamSeasons);

	test("distribute combinations to teams with the same record", async () => {
		const teams = await idb.getCopies.teamsPlus({
			attrs: ["tid"],
			seasonAttrs: [
				"won",
				"lost",
				"tied",
				"winp",
				"playoffRoundsWon",
				"cid",
				"did",
			],
			season: g.get("season"),
			addDummySeason: true,
			active: true,
		});
		const chances = [250, 199, 156, 119, 88, 63, 43, 28, 17, 11, 8, 7, 6, 5]; // index instead of tid

		const sameRec = [
			[6, 7, 8],
			[10, 11, 12],
		];
		lotterySort(teams);
		updateChances(chances, teams, false);

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
		updateChances(chances, teams, true);

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
