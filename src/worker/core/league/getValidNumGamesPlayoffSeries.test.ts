import { assert, test } from "vitest";
import getValidNumGamesPlayoffSeries from "./getValidNumGamesPlayoffSeries.ts";

test("handles normal case", () => {
	const numGamesPlayoffSeries = getValidNumGamesPlayoffSeries(
		[5, 7, 7, 7],
		undefined,
		30,
	);
	assert.deepStrictEqual(numGamesPlayoffSeries, [5, 7, 7, 7]);
});

test("handles lengthening playoffs when numPlayoffRounds is set", () => {
	const numGamesPlayoffSeries = getValidNumGamesPlayoffSeries([3, 5], 3, 30);
	assert.deepStrictEqual(numGamesPlayoffSeries, [3, 5, 5]);
});

test("handles truncating playoffs when numPlayoffRounds is set", () => {
	const numGamesPlayoffSeries = getValidNumGamesPlayoffSeries([5, 7], 1, 30);
	assert.deepStrictEqual(numGamesPlayoffSeries, [5]);
});

test("handles truncating playoffs if not enough teams", () => {
	const numGamesPlayoffSeries = getValidNumGamesPlayoffSeries(
		[5, 7, 7, 7],
		undefined,
		7,
	);
	assert.deepStrictEqual(numGamesPlayoffSeries, [5, 7]);
});
