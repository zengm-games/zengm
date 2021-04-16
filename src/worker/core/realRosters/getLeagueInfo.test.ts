import assert from "assert";
import { PHASE } from "../../../common";
import getLeagueInfo from "./getLeagueInfo";
import * as fs from "fs";
import * as path from "path";

describe("worker/core/realRosters/getLeagueInfo", () => {
	let originalFetch: any;
	beforeAll(() => {
		const realPlayerData = JSON.parse(
			fs.readFileSync(
				path.join(
					__dirname,
					"..",
					"..",
					"..",
					"..",
					"data",
					"real-player-data.basketball.json",
				),
				"utf8",
			),
		);
		originalFetch = global.fetch;
		(global as any).fetch = async () => {
			return {
				json: async () => realPlayerData,
			};
		};
	});
	afterAll(() => {
		global.fetch = originalFetch;
	});

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
