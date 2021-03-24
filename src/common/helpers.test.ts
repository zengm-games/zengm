import assert from "assert";
import { helpers } from ".";

describe("common/helpers", () => {
	describe("getTeamsDefault", () => {
		test("return correct length array", () => {
			assert.strictEqual(helpers.getTeamsDefault().length, 30);
		});
	});

	describe("deepCopy", () => {
		const obj = {
			a: 5,
			b: "hi",
			c: [1, 2, 3],
		};

		test("return same object as input", () => {
			assert.deepStrictEqual(helpers.deepCopy(obj), obj);
		});

		test("don't let changes in output propagate to input", () => {
			const obj2 = helpers.deepCopy(obj);
			obj2.a = 2;
			assert.notDeepEqual(helpers.deepCopy(obj), obj2);
		});

		test("don't let changes in input propagate to output", () => {
			const obj2 = helpers.deepCopy(obj);
			obj.a = 2;
			assert.notDeepEqual(helpers.deepCopy(obj), obj2);
		});
	});

	describe("formatCurrency", () => {
		test("work with no extra options", () => {
			assert.strictEqual(helpers.formatCurrency(52.766), "$52.77");
		});

		test("append a string, if supplied", () => {
			assert.strictEqual(
				helpers.formatCurrency(64363.764376, "Q"),
				"$64363.76Q",
			);
			assert.strictEqual(
				helpers.formatCurrency(0.794, "whatever"),
				"$0.79whatever",
			);
		});

		test("round to any precision", () => {
			assert.strictEqual(
				helpers.formatCurrency(64363.764376, "Q", 5),
				"$64363.76438Q",
			);
			assert.strictEqual(
				helpers.formatCurrency(0.794, "whatever", 0),
				"$1whatever",
			);
		});

		test("truncate trailing 0s", () => {
			assert.strictEqual(
				helpers.formatCurrency(64363.99, "Q", 2),
				"$64363.99Q",
			);
			assert.strictEqual(helpers.formatCurrency(64363.9, "Q", 2), "$64363.9Q");
			assert.strictEqual(helpers.formatCurrency(64363.0, "Q", 2), "$64363Q");
			assert.strictEqual(helpers.formatCurrency(64363, "Q", 2), "$64363Q");
		});
	});

	describe("getPopRanks", () => {
		const makeObj = (pops: number[]) =>
			pops.map((pop, i) => ({
				pop,
				tid: i,
			}));

		test("works when there are no ties", () => {
			assert.deepStrictEqual(
				helpers.getPopRanks(makeObj([1.5, 10, 0.2, 15, -2])),
				[3, 2, 4, 1, 5],
			);
		});

		test("averages together tied populations", () => {
			assert.deepStrictEqual(
				helpers.getPopRanks(makeObj([5, 5, 10, 10, 10, 1, 7])),
				[5.5, 5.5, 2, 2, 2, 7, 4],
			);
		});
	});
});
