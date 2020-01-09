import assert from "assert";
import helpers from "./helpers";

describe("ui/util/helpers", () => {
	describe("numberWithCommas", () => {
		test("work", () => {
			assert.equal(helpers.numberWithCommas(5823795234), "5,823,795,234");
			assert.equal(helpers.numberWithCommas(582.3795234), "582");
			assert.equal(helpers.numberWithCommas("5823795234"), "5,823,795,234");
			assert.equal(helpers.numberWithCommas("582.3795234"), "582");
		});
	});
});
