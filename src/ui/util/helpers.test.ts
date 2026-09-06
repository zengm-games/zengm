import { assert, describe, test } from "vitest";
import { helpers } from "./helpers.ts";

describe("numberWithCommas", () => {
	test("work", () => {
		assert.strictEqual(helpers.numberWithCommas(5823795234), "5,823,795,234");
		assert.strictEqual(helpers.numberWithCommas(582.3795234), "582.3795234");
		assert.strictEqual(helpers.numberWithCommas("5823795234"), "5,823,795,234");
		assert.strictEqual(helpers.numberWithCommas("582.3795234"), "582.3795234");
		assert.strictEqual(helpers.numberWithCommas(49.99), "49.99");
	});

	test("handle maximumFractionDigits parameter", () => {
		assert.strictEqual(helpers.numberWithCommas(0.12345678901), "0.123456789");
		assert.strictEqual(
			helpers.numberWithCommas(0.12345678901, 8),
			"0.12345679",
		);
		assert.strictEqual(helpers.numberWithCommas(0.12345678901, 3), "0.123");
	});
});

describe("roundStat", () => {
	test("work", () => {
		assert.strictEqual(helpers.roundStat(49.99, "fgp"), "50.0");
		assert.strictEqual(helpers.roundStat(49.9, "fgp"), "49.9");
		assert.strictEqual(helpers.roundStat(100, "fgp"), "100");
		assert.strictEqual(helpers.roundStat(15.7, "trb"), "15.7");
		assert.strictEqual(helpers.roundStat(15.7, "trb", true), "16");
	});
});

describe("yearRanges", () => {
	test("work", () => {
		assert.deepStrictEqual(helpers.yearRanges([2026]), ["2026"]);
		assert.deepStrictEqual(helpers.yearRanges([2026, 2028]), ["2026", "2028"]);
		assert.deepStrictEqual(helpers.yearRanges([2026, 2027]), ["2026-27"]);
		assert.deepStrictEqual(helpers.yearRanges([2000, 2001, 2026, 2027]), [
			"2000-01",
			"2026-27",
		]);
		assert.deepStrictEqual(helpers.yearRanges([2029, 2030]), ["2029-30"]);
		assert.deepStrictEqual(helpers.yearRanges([2099, 2100]), ["2099-2100"]);
		assert.deepStrictEqual(helpers.yearRanges([999, 1000]), ["999-1000"]);
		assert.deepStrictEqual(
			helpers.yearRanges([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]),
			["1-10"],
		);
	});
});
