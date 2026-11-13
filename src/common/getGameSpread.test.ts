import { assert, test } from "vitest";
import { formatGameSpreads, getGameSpread } from "./getGameSpread.ts";

const base = {
	homeCourtAdvantage: 1,
	neutral: false,
	numPeriods: 4,
	ovrs: [60, 50],
	quarterLength: 12,
} as const;

test("favors the better team by 0.3 per ovr plus home court", () => {
	assert.closeTo(getGameSpread(base), 6.3504, 1e-9);
	assert.closeTo(getGameSpread({ ...base, ovrs: [50, 60] }), 0.3504, 1e-9);
});

test("no home court at a neutral site", () => {
	assert.closeTo(getGameSpread({ ...base, neutral: true }), 3, 1e-9);
});

test("scales home court with the setting", () => {
	assert.closeTo(
		getGameSpread({ ...base, homeCourtAdvantage: 2 }),
		9.7008,
		1e-9,
	);
});

test("scales with game length", () => {
	assert.closeTo(getGameSpread({ ...base, quarterLength: 6 }), 3.1752, 1e-9);
	assert.closeTo(getGameSpread({ ...base, numPeriods: 2 }), 3.1752, 1e-9);
});

test("formats the spread the way ScoreBox always has", () => {
	assert.deepEqual(formatGameSpreads(6.3504), ["-6.5", undefined]);
	assert.deepEqual(formatGameSpreads(-3.1), [undefined, "-3"]);
	assert.deepEqual(formatGameSpreads(0.2), [undefined, "PK"]);
	assert.deepEqual(formatGameSpreads(12.25), ["-12.5", undefined]);
});
