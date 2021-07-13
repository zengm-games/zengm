import assert from "assert";
import { PHASE } from "../../../common";
import getLeagueInfo from "./getLeagueInfo";

describe("worker/core/realRosters/getLeagueInfo", () => {
	test("returns correct number of teams", async () => {
		assert.strictEqual(
			(
				await getLeagueInfo({
					type: "real",
					season: 1956,
					phase: PHASE.PRESEASON,
					randomDebuts: false,
					realDraftRatings: "rookie",
					realStats: "none",
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
					randomDebuts: false,
					realDraftRatings: "rookie",
					realStats: "none",
				})
			).teams.length,
			30,
		);
	});

	test("returns correct number of teams after an expansion draft", async () => {
		assert.strictEqual(
			(
				await getLeagueInfo({
					type: "real",
					season: 2004,
					phase: PHASE.PRESEASON,
					randomDebuts: false,
					realDraftRatings: "rookie",
					realStats: "none",
				})
			).teams.length,
			29,
		);
		assert.strictEqual(
			(
				await getLeagueInfo({
					type: "real",
					season: 2004,
					phase: PHASE.DRAFT_LOTTERY,
					randomDebuts: false,
					realDraftRatings: "rookie",
					realStats: "none",
				})
			).teams.length,
			30,
		);
	});

	test("returns correct number of teams after contraction", async () => {
		assert.strictEqual(
			(
				await getLeagueInfo({
					type: "real",
					season: 1950,
					phase: PHASE.PRESEASON,
					randomDebuts: false,
					realDraftRatings: "rookie",
					realStats: "none",
				})
			).teams.length,
			17,
		);
		assert.strictEqual(
			(
				await getLeagueInfo({
					type: "real",
					season: 1950,
					phase: PHASE.DRAFT_LOTTERY,
					randomDebuts: false,
					realDraftRatings: "rookie",
					realStats: "none",
				})
			).teams.length,
			11,
		);
	});
});
