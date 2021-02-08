import assert from "assert";
import helpers from "./helpers";

describe("ui/util/helpers", () => {
	describe("numberWithCommas", () => {
		test("work", () => {
			assert.strictEqual(helpers.numberWithCommas(5823795234), "5,823,795,234");
			assert.strictEqual(helpers.numberWithCommas(582.3795234), "582.3795234");
			assert.strictEqual(
				helpers.numberWithCommas("5823795234"),
				"5,823,795,234",
			);
			assert.strictEqual(
				helpers.numberWithCommas("582.3795234"),
				"582.3795234",
			);
			assert.strictEqual(helpers.numberWithCommas(49.99), "49.99");
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
});
