import assert from "assert";
import { defaultGameAttributes, helpers } from "../../util";
import createGameAttributes from "./createGameAttributes";
import { PHASE } from "../../../common";

describe("worker/core/league/createGameAttributes", () => {
	test("save integer in wrapped format", () => {
		const gameAttributes = createGameAttributes({
			difficulty: 0,
			leagueFile: { startingSeason: 2015 },
			teamInfos: helpers.getTeamsDefault(),
			userTid: 5,
		});

		assert.deepStrictEqual(gameAttributes.userTid, [
			{ start: -Infinity, value: 5 },
		]);
	});

	test("maintain history", () => {
		const gameAttributes = createGameAttributes({
			difficulty: 0,
			leagueFile: {
				startingSeason: 2015,
				gameAttributes: {
					startingSeason: 2010,
					userTid: [
						{ start: -Infinity, value: 3 },
						{ start: 2013, value: 5 },
					],
				},
			},
			teamInfos: helpers.getTeamsDefault(),
			userTid: 5,
		});

		assert.deepStrictEqual(gameAttributes.userTid, [
			{ start: -Infinity, value: 3 },
			{ start: 2013, value: 5 },
		]);
	});

	test("maintain history while selecting a new team", () => {
		const gameAttributes = createGameAttributes({
			difficulty: 0,
			leagueFile: {
				startingSeason: 2015,
				gameAttributes: {
					startingSeason: 2010,
					userTid: [
						{ start: -Infinity, value: 3 },
						{ start: 2013, value: 4 },
					],
				},
			},
			teamInfos: helpers.getTeamsDefault(),
			userTid: 5,
		});

		assert.deepStrictEqual(gameAttributes.userTid, [
			{ start: -Infinity, value: 3 },
			{ start: 2013, value: 4 },
			{ start: 2015, value: 5 },
		]);
	});

	test("maintain history while selecting a new team, overwriting current season", () => {
		const gameAttributes = createGameAttributes({
			difficulty: 0,
			leagueFile: {
				startingSeason: 2015,
				gameAttributes: {
					startingSeason: 2010,
					userTid: [
						{ start: -Infinity, value: 3 },
						{ start: 2015, value: 5 },
					],
				},
			},
			teamInfos: helpers.getTeamsDefault(),
			userTid: 5,
		});

		assert.deepStrictEqual(gameAttributes.userTid, [
			{ start: -Infinity, value: 3 },
			{ start: 2015, value: 5 },
		]);
	});

	test("new team after playoffs", () => {
		const gameAttributes = createGameAttributes({
			difficulty: 0,
			leagueFile: {
				startingSeason: 2015,
				gameAttributes: {
					startingSeason: 2010,
					phase: PHASE.DRAFT,
					userTid: [
						{ start: -Infinity, value: 3 },
						{ start: 2015, value: 4 },
					],
				},
			},
			teamInfos: helpers.getTeamsDefault(),
			userTid: 5,
		});

		assert.deepStrictEqual(gameAttributes.userTid, [
			{ start: -Infinity, value: 3 },
			{ start: 2015, value: 4 },
			{ start: 2016, value: 5 },
		]);
	});

	describe("tiebreakers", () => {
		const defaultArgs = {
			difficulty: 0,
			teamInfos: helpers.getTeamsDefault(),
			userTid: 5,
		};

		test("apply new default to an empty league file", () => {
			const gameAttributes = createGameAttributes({
				...defaultArgs,
				leagueFile: {
					startingSeason: 2021,
				},
			});

			assert.deepStrictEqual(
				gameAttributes.tiebreakers,
				defaultGameAttributes.tiebreakers,
			);
		});

		test("apply new default to an old version league file with no gameAttributes", () => {
			const gameAttributes = createGameAttributes({
				...defaultArgs,
				version: 40,
				leagueFile: {
					startingSeason: 2021,
				},
			});

			assert.deepStrictEqual(
				gameAttributes.tiebreakers,
				defaultGameAttributes.tiebreakers,
			);
		});

		describe("apply new default to an old version league file, only for upcoming season", () => {
			test("during regular season", () => {
				const gameAttributes = createGameAttributes({
					...defaultArgs,
					version: 40,
					leagueFile: {
						startingSeason: 2021,
						gameAttributes: {
							season: 2023,
							phase: PHASE.REGULAR_SEASON,
						},
					},
				});

				assert.deepStrictEqual(gameAttributes.tiebreakers[0].start, -Infinity);
				assert.deepStrictEqual(gameAttributes.tiebreakers[0].value, [
					"coinFlip",
				]);
				assert.deepStrictEqual(gameAttributes.tiebreakers[1].start, 2023);
				assert.deepStrictEqual(
					gameAttributes.tiebreakers[1].value,
					defaultGameAttributes.tiebreakers[0].value,
				);
			});

			test("after regular season", () => {
				const gameAttributes = createGameAttributes({
					...defaultArgs,
					version: 40,
					leagueFile: {
						startingSeason: 2021,
						gameAttributes: {
							season: 2023,
							phase: PHASE.DRAFT_LOTTERY,
						},
					},
				});

				assert.deepStrictEqual(gameAttributes.tiebreakers[0].start, -Infinity);
				assert.deepStrictEqual(gameAttributes.tiebreakers[0].value, [
					"coinFlip",
				]);
				assert.deepStrictEqual(gameAttributes.tiebreakers[1].start, 2024);
				assert.deepStrictEqual(
					gameAttributes.tiebreakers[1].value,
					defaultGameAttributes.tiebreakers[0].value,
				);
			});

			test("during expansion draft after season", () => {
				const gameAttributes = createGameAttributes({
					...defaultArgs,
					version: 40,
					leagueFile: {
						startingSeason: 2021,
						gameAttributes: {
							season: 2023,
							phase: PHASE.EXPANSION_DRAFT,
							nextPhase: PHASE.DRAFT_LOTTERY,
						},
					},
				});

				assert.deepStrictEqual(gameAttributes.tiebreakers[0].start, -Infinity);
				assert.deepStrictEqual(gameAttributes.tiebreakers[0].value, [
					"coinFlip",
				]);
				assert.deepStrictEqual(gameAttributes.tiebreakers[1].start, 2024);
				assert.deepStrictEqual(
					gameAttributes.tiebreakers[1].value,
					defaultGameAttributes.tiebreakers[0].value,
				);
			});
		});

		test("do nothing to new version league file", () => {
			const gameAttributes = createGameAttributes({
				...defaultArgs,
				version: 43,
				leagueFile: {
					startingSeason: 2021,
					gameAttributes: {
						tiebreakers: "foo",
					},
				},
			});

			assert.deepStrictEqual(gameAttributes.tiebreakers, "foo");
		});
	});
});
