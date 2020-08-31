import assert from "assert";
import { helpers } from "../../util";
import createGameAttributes from "./createGameAttributes";
import { PHASE } from "../../../common";

describe("worker/core/league/createGameAttributes", () => {
	test("save integer in wrapped format", async () => {
		const gameAttributes = await createGameAttributes({
			difficulty: 0,
			leagueFile: { startingSeason: 2015 },
			leagueName: "Test",
			teamInfos: helpers.getTeamsDefault(),
			userTid: 5,
		});

		assert.deepStrictEqual(gameAttributes.userTid, [
			{ start: -Infinity, value: 5 },
		]);
	});

	test("maintain history", async () => {
		const gameAttributes = await createGameAttributes({
			difficulty: 0,
			leagueFile: {
				startingSeason: 2015,
				gameAttributes: [
					{ key: "startingSeason", value: 2010 },
					{
						key: "userTid",
						value: [
							{ start: -Infinity, value: 3 },
							{ start: 2013, value: 5 },
						],
					},
				],
			},
			leagueName: "Test",
			teamInfos: helpers.getTeamsDefault(),
			userTid: 5,
		});

		assert.deepStrictEqual(gameAttributes.userTid, [
			{ start: -Infinity, value: 3 },
			{ start: 2013, value: 5 },
		]);
	});

	test("maintain history while selecting a new team", async () => {
		const gameAttributes = await createGameAttributes({
			difficulty: 0,
			leagueFile: {
				startingSeason: 2015,
				gameAttributes: [
					{ key: "startingSeason", value: 2010 },
					{
						key: "userTid",
						value: [
							{ start: -Infinity, value: 3 },
							{ start: 2013, value: 4 },
						],
					},
				],
			},
			leagueName: "Test",
			teamInfos: helpers.getTeamsDefault(),
			userTid: 5,
		});

		assert.deepStrictEqual(gameAttributes.userTid, [
			{ start: -Infinity, value: 3 },
			{ start: 2013, value: 4 },
			{ start: 2015, value: 5 },
		]);
	});

	test("maintain history while selecting a new team, overwriting current season", async () => {
		const gameAttributes = await createGameAttributes({
			difficulty: 0,
			leagueFile: {
				startingSeason: 2015,
				gameAttributes: [
					{ key: "startingSeason", value: 2010 },
					{
						key: "userTid",
						value: [
							{ start: -Infinity, value: 3 },
							{ start: 2015, value: 4 },
						],
					},
				],
			},
			leagueName: "Test",
			teamInfos: helpers.getTeamsDefault(),
			userTid: 5,
		});

		assert.deepStrictEqual(gameAttributes.userTid, [
			{ start: -Infinity, value: 3 },
			{ start: 2015, value: 5 },
		]);
	});

	test("new team after playoffs", async () => {
		const gameAttributes = await createGameAttributes({
			difficulty: 0,
			leagueFile: {
				startingSeason: 2015,
				gameAttributes: [
					{ key: "startingSeason", value: 2010 },
					{ key: "phase", value: PHASE.DRAFT },
					{
						key: "userTid",
						value: [
							{ start: -Infinity, value: 3 },
							{ start: 2015, value: 4 },
						],
					},
				],
			},
			leagueName: "Test",
			teamInfos: helpers.getTeamsDefault(),
			userTid: 5,
		});

		assert.deepStrictEqual(gameAttributes.userTid, [
			{ start: -Infinity, value: 3 },
			{ start: 2015, value: 4 },
			{ start: 2016, value: 5 },
		]);
	});
});
