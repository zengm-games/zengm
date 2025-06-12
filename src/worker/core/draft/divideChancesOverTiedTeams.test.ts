import { afterAll, assert, beforeAll, test } from "vitest";
import { loadTeamSeasons } from "./testHelpers.ts";
import lotterySort from "./lotterySort.ts";
import divideChancesOverTiedTeams from "./divideChancesOverTiedTeams.ts";
import { idb } from "../../db/index.ts";
import { g } from "../../util/index.ts";
import testHelpers from "../../../test/helpers.ts";

beforeAll(async () => {
	testHelpers.resetG();
	idb.league = testHelpers.mockIDBLeague();

	await loadTeamSeasons();
});
afterAll(() => {
	// @ts-expect-error
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

	for (const tids of sameRec) {
		let value = 0;

		for (const tid of tids) {
			const chance = chances[tid]!;
			if (value === 0) {
				value = chance;
			} else {
				assert.strictEqual(value, chance);
			}
		}
	}

	// test if isFinal is true
	divideChancesOverTiedTeams(chances, teams, true);

	for (const tids of sameRec) {
		let value = 0;
		let maxIdx = -1;

		for (let j = tids.length - 1; j >= 0; j--) {
			const tid = tids[j]!;
			const chance = chances[tid]!;
			if (value <= chance) {
				value = chance;
				maxIdx = j;
			}
		}

		assert.strictEqual(maxIdx, 0);
	}
});
