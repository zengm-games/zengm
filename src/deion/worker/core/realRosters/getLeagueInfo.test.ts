import assert from "assert";
import getLeagueInfo from "./getLeagueInfo";

describe("worker/core/realRosters/getLeagueInfo", () => {
	test.only("returns correct number of teams", () => {
		assert.equal(
			getLeagueInfo({
				type: "real",
				season: 1956,
			}).teams.length,
			8,
		);

		assert.equal(
			getLeagueInfo({
				type: "real",
				season: 2020,
			}).teams.length,
			30,
		);
	});
});
