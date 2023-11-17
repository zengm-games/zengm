import assert from "node:assert/strict";
import { maxBy, minBy, omit, range } from "./utils";

describe("common/utils", () => {
	test("range", () => {
		assert.deepStrictEqual(range(5), [0, 1, 2, 3, 4]);
		assert.deepStrictEqual(range(0), []);
		assert.deepStrictEqual(range(2, 5), [2, 3, 4]);
	});

	test("maxBy and minBy", () => {
		const items = [
			{
				a: 1,
			},
			{
				a: 3,
			},
			{
				a: 0,
			},
			{
				a: 2,
			},
		];

		assert.deepStrictEqual(maxBy(items, "a"), {
			a: 3,
		});
		assert.deepStrictEqual(minBy(items, "a"), {
			a: 0,
		});
		assert.deepStrictEqual(
			maxBy(items, item => -item.a),
			{
				a: 0,
			},
		);
		assert.deepStrictEqual(
			minBy(items, item => -item.a),
			{
				a: 3,
			},
		);
	});

	test("omit", () => {
		const object = {
			a: 1,
			b: 2,
			c: 3,
		};

		assert.deepStrictEqual(omit(object, "b"), {
			a: 1,
			c: 3,
		});
	});
});
