import assert from "assert";
import testHelpers from "../../../test/helpers";
import lotterySort from "./lotterySort";
import { g } from "../../util";

describe("worker/core/draft/lotterySort", () => {
	test("projects playoff appearances when sorting for a projected lottery", async () => {
		testHelpers.resetG();
		g.setWithoutSavingToDB("numGamesPlayoffSeries", [7]); // Two top teams are in the same conference. Only one will make the playoffs.

		const teams = [
			{
				tid: 0,
				seasonAttrs: {
					cid: 0,
					did: 0,
					winp: 0.9,
					playoffRoundsWon: -1,
					won: 9,
					lost: 1,
					tied: 0,
				},
			},
			{
				tid: 1,
				seasonAttrs: {
					cid: 0,
					did: 0,
					winp: 0.8,
					playoffRoundsWon: -1,
					won: 8,
					lost: 2,
					tied: 0,
				},
			},
			{
				tid: 2,
				seasonAttrs: {
					cid: 1,
					did: 1,
					winp: 0.1,
					playoffRoundsWon: -1,
					won: 1,
					lost: 9,
					tied: 0,
				},
			},
			{
				tid: 3,
				seasonAttrs: {
					cid: 1,
					did: 1,
					winp: 0.2,
					playoffRoundsWon: -1,
					won: 2,
					lost: 8,
					tied: 0,
				},
			},
		];
		lotterySort(teams);
		assert.deepStrictEqual(
			teams.map(t => t.tid),
			[2, 1, 3, 0],
		);
	});
});
