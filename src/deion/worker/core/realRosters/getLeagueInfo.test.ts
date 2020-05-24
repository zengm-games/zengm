import assert from "assert";
import getLeagueInfo from "./getLeagueInfo";

describe("worker/core/realRosters/getLeagueInfo", () => {
	test.skip("returns correct number of teams", async () => {
		assert.equal(
			(
				await getLeagueInfo({
					type: "real",
					season: 1956,
				})
			).teams.length,
			8,
		);

		assert.equal(
			(
				await getLeagueInfo({
					type: "real",
					season: 2020,
				})
			).teams.length,
			30,
		);
	});
});
