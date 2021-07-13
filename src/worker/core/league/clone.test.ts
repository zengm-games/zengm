import assert from "assert";
import { getCloneName } from "./clone";

describe("core/league/clone", () => {
	describe("getCloneName", () => {
		test("base case", () => {
			const name = getCloneName("test", ["test"]);
			assert.strictEqual(name, "test (clone)");
		});

		test("2nd clone", () => {
			const name = getCloneName("test", ["test", "test (clone)"]);
			assert.strictEqual(name, "test (clone 2)");
		});

		test("clone the clone", () => {
			const name = getCloneName("test (clone)", ["test", "test (clone)"]);
			assert.strictEqual(name, "test (clone 2)");
		});

		test("clone the clone, while a second clone already exists", () => {
			const name = getCloneName("test (clone)", [
				"test",
				"test (clone)",
				"test (clone 2)",
			]);
			assert.strictEqual(name, "test (clone 3)");
		});

		test("clone the second clone", () => {
			const name = getCloneName("test (clone 2)", [
				"test",
				"test (clone)",
				"test (clone 2)",
			]);
			assert.strictEqual(name, "test (clone 3)");
		});

		test("clone the second clone when the first clone is deleted", () => {
			const name = getCloneName("test (clone 2)", ["test", "test (clone 2)"]);
			assert.strictEqual(name, "test (clone 3)");
		});
	});
});
