import assert from "assert";
import LngTracker from "./LngTracker";

describe("worker/core/GameSim.football/LngTracker", () => {
	test("works", () => {
		const lngTracker = new LngTracker();
		const value = lngTracker.log("player", 4, "foo", 6);
		assert.strictEqual(value, 6, "logs value");

		const value2 = lngTracker.log("player", 4, "foo", 16);
		assert.strictEqual(value2, 16, "replaces value");

		const value3 = lngTracker.log("player", 4, "foo", 10, true);
		assert.strictEqual(value3, 16, "removes value not seen before - noop");

		const value4 = lngTracker.log("player", 4, "foo", 16, true);
		assert.strictEqual(value4, 6, "removes last value");
	});

	test("works with negative values", () => {
		const lngTracker = new LngTracker();
		const value = lngTracker.log("player", 4, "foo", -6);
		assert.strictEqual(value, -6, "logs value");

		const value2 = lngTracker.log("player", 4, "foo", -1);
		assert.strictEqual(value2, -1, "replaces value");

		const value3 = lngTracker.log("player", 4, "foo", -3, true);
		assert.strictEqual(value3, -1, "removes value not seen before - noop");

		const value4 = lngTracker.log("player", 4, "foo", -1, true);
		assert.strictEqual(value4, -6, "removes last value");
	});
});
