import assert from "assert";
import getValidNumGamesPlayoffSeries from "./getValidNumGamesPlayoffSeries";

describe("worker/core/league/getValidNumGamesPlayoffSeries", () => {
	test("handles normal case", async () => {
		const numGamesPlayoffSeries = getValidNumGamesPlayoffSeries(
			[5, 7, 7, 7],
			undefined,
			30,
		);
		assert.deepStrictEqual(numGamesPlayoffSeries, [5, 7, 7, 7]);
	});

	test("handles lengthening playoffs when numPlayoffRounds is set", async () => {
		const numGamesPlayoffSeries = getValidNumGamesPlayoffSeries([3, 5], 3, 30);
		assert.deepStrictEqual(numGamesPlayoffSeries, [3, 5, 5]);
	});

	test("handles truncating playoffs when numPlayoffRounds is set", async () => {
		const numGamesPlayoffSeries = getValidNumGamesPlayoffSeries([5, 7], 1, 30);
		assert.deepStrictEqual(numGamesPlayoffSeries, [5]);
	});

	test("handles truncating playoffs if not enough teams", async () => {
		const numGamesPlayoffSeries = getValidNumGamesPlayoffSeries(
			[5, 7, 7, 7],
			undefined,
			7,
		);
		assert.deepStrictEqual(numGamesPlayoffSeries, [5, 7]);
	});
});
