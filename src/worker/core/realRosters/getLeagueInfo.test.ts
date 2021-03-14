import assert from "assert";
import { PHASE } from "../../../common";
import getLeagueInfo from "./getLeagueInfo";

describe("worker/core/realRosters/getLeagueInfo", () => {
	test.skip("returns correct number of teams", async () => {
		assert.strictEqual(
			(
				await getLeagueInfo({
					type: "real",
					season: 1956,
					phase: PHASE.PRESEASON,
				})
			).teams.length,
			8,
		);

		assert.strictEqual(
			(
				await getLeagueInfo({
					type: "real",
					season: 2021,
					phase: PHASE.PRESEASON,
				})
			).teams.length,
			30,
		);

		// Test season with expansion draft
		assert.strictEqual(
			(
				await getLeagueInfo({
					type: "real",
					season: 2014,
					phase: PHASE.PRESEASON,
				})
			).teams.length,
			29,
		);
		assert.strictEqual(
			(
				await getLeagueInfo({
					type: "real",
					season: 2014,
					phase: PHASE.DRAFT_LOTTERY,
				})
			).teams.length,
			30,
		);
	});
});
