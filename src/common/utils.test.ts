import { assert, describe, test } from "vitest";
import { chunk, countBy, maxBy, minBy, omit, orderBy, range } from "./utils.ts";

test("range", () => {
	assert.deepStrictEqual(range(5), [0, 1, 2, 3, 4]);
	assert.deepStrictEqual(range(0), []);
	assert.deepStrictEqual(range(2, 5), [2, 3, 4]);
	assert.deepStrictEqual(range(5, 2), [5, 4, 3]);
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
		maxBy(items, (item) => -item.a),
		{
			a: 0,
		},
	);
	assert.deepStrictEqual(
		minBy(items, (item) => -item.a),
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

	assert.deepStrictEqual(omit(object, ["b"]), {
		a: 1,
		c: 3,
	});
});

test("countBy", () => {
	assert.deepStrictEqual(
		countBy([6.1, 4.2, 6.3], (x) => Math.floor(x)),
		{ 4: 1, 6: 2 },
	);
});

describe("orderBy", () => {
	test("normal function", () => {
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

		assert.deepStrictEqual(orderBy(items, "a", "asc"), [
			{
				a: 0,
			},
			{
				a: 1,
			},
			{
				a: 2,
			},
			{
				a: 3,
			},
		]);

		assert.deepStrictEqual(orderBy(items, "a", "desc"), [
			{
				a: 3,
			},
			{
				a: 2,
			},
			{
				a: 1,
			},
			{
				a: 0,
			},
		]);
	});

	test("array of arrays", () => {
		const items = [[3], [1], [2]];

		assert.deepStrictEqual(orderBy(items, 0, "asc"), [[1], [2], [3]]);

		assert.deepStrictEqual(orderBy(items, 0, "desc"), [[3], [2], [1]]);
	});

	// lodash did this, and parts of my code do it too
	test("sorting undefined results in empty array", () => {
		assert.deepStrictEqual(orderBy(undefined as any, "a" as any), []);
	});

	// lodash did this (I think) and parts of my code rely on it
	test("null/undefined is treated like Infinity", () => {
		for (const nullUndefined of [null, undefined]) {
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
				{
					a: nullUndefined,
				},
			];

			assert.deepStrictEqual(orderBy(items, "a", "asc"), [
				{
					a: 0,
				},
				{
					a: 1,
				},
				{
					a: 2,
				},
				{
					a: 3,
				},
				{
					a: nullUndefined,
				},
			]);

			assert.deepStrictEqual(orderBy(items, "a", "desc"), [
				{
					a: nullUndefined,
				},
				{
					a: 3,
				},
				{
					a: 2,
				},
				{
					a: 1,
				},
				{
					a: 0,
				},
			]);
		}
	});

	test("null/undefined is treated as last possibly string (also kind of tests mixed string/number sorting)", () => {
		for (const nullUndefined of [null, undefined]) {
			const items = [
				{
					abbrev: "CIN",
				},
				{
					abbrev: nullUndefined,
				},
			];
			assert.deepStrictEqual(orderBy(items, "abbrev", "asc"), [
				{
					abbrev: "CIN",
				},
				{
					abbrev: nullUndefined,
				},
			]);
			assert.deepStrictEqual(orderBy(items, "abbrev", "desc"), [
				{
					abbrev: nullUndefined,
				},
				{
					abbrev: "CIN",
				},
			]);
		}
	});

	test("calls each key function once per item", () => {
		const items = [5, 3, 8, 1, 9, 2, 7, 4, 6, 0].map((a) => ({ a }));
		let numCalls = 0;
		const sorted = orderBy(
			items,
			(item) => {
				numCalls += 1;
				return item.a;
			},
			"asc",
		);
		assert.deepStrictEqual(
			sorted.map((item) => item.a),
			[0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
		);
		assert.strictEqual(numCalls, items.length);
	});

	test("keeps input order for equal sort values", () => {
		const items = [
			{ a: 1, id: "x" },
			{ a: 0, id: "y" },
			{ a: 1, id: "z" },
			{ a: 0, id: "w" },
		];
		assert.deepStrictEqual(
			orderBy(items, "a", "asc").map((item) => item.id),
			["y", "w", "x", "z"],
		);
		assert.deepStrictEqual(
			orderBy(items, "a", "desc").map((item) => item.id),
			["x", "z", "y", "w"],
		);
	});
});

test("chunk", () => {
	assert.deepStrictEqual(chunk([1, 2, 3, 4, 5, 6], 2), [
		[1, 2],
		[3, 4],
		[5, 6],
	]);

	assert.deepStrictEqual(chunk([1, 2, 3, 4, 5, 6], 4), [
		[1, 2, 3, 4],
		[5, 6],
	]);
});
