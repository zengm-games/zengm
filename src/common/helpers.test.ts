import { assert, describe, test } from "vitest";
import { helpers } from "./helpers.ts";
import type { LeagueUrlParts } from "../ui/router/types.ts";

describe("numberWithCommas", () => {
	const numbers = [
		0,
		-0,
		1,
		-1,
		1234567.8901234567,
		-1234567.8901234567,
		0.00000000004,
		-0.00000000004,
		0.00000000005,
		-0.00000000005,
		1.99999999995,
		Number.EPSILON,
		Number.MIN_VALUE,
		Number.MAX_VALUE,
		Number.MAX_SAFE_INTEGER,
		Number.NaN,
		Infinity,
		-Infinity,
	];

	test("default precision matches locale formatting for numeric edge cases", () => {
		for (const value of numbers) {
			const expected = value.toLocaleString("en-US", {
				maximumFractionDigits: 10,
			});
			assert.strictEqual(helpers.numberWithCommas(value), expected);
			assert.strictEqual(helpers.numberWithCommas(value, 10), expected);
		}
		assert.strictEqual(helpers.numberWithCommas(-0), "-0");
	});

	test("string inputs retain decimal-comma and parseFloat behavior", () => {
		const strings = [
			"12345,6789",
			"  -12345.6789  ",
			"-0",
			"1,234,567",
			"12.5suffix",
			"1e20",
			"1e-20",
			"Infinity",
			"-Infinity",
			"NaN",
			"",
			"not a number",
		];
		for (const value of strings) {
			const expected = Number.parseFloat(
				value.replaceAll(",", "."),
			).toLocaleString("en-US", { maximumFractionDigits: 10 });
			assert.strictEqual(helpers.numberWithCommas(value), expected);
		}
		assert.strictEqual(helpers.numberWithCommas("12345,6789"), "12,345.6789");
		assert.strictEqual(helpers.numberWithCommas("1,234,567"), "1.234");
	});

	test("custom precision matches locale formatting, including fractional precision", () => {
		for (const maximumFractionDigits of [0, -0, 1, 2, 3, 9, 10, 10.5, 11, 20]) {
			for (const value of numbers) {
				assert.strictEqual(
					helpers.numberWithCommas(value, maximumFractionDigits),
					value.toLocaleString("en-US", { maximumFractionDigits }),
				);
			}
			assert.strictEqual(
				helpers.numberWithCommas("12345,6789", maximumFractionDigits),
				(12345.6789).toLocaleString("en-US", { maximumFractionDigits }),
			);
		}
	});

	test("invalid custom precision still throws the original RangeError", () => {
		for (const maximumFractionDigits of [
			-1,
			Number.NaN,
			Infinity,
			-Infinity,
			101,
		]) {
			assert.throws(
				() => (1).toLocaleString("en-US", { maximumFractionDigits }),
				RangeError,
			);
			assert.throws(
				() => helpers.numberWithCommas(1, maximumFractionDigits),
				RangeError,
			);
		}
	});
});

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
		assert.strictEqual(
			helpers.formatCurrencyBase(["$", ".", ""], 52.766),
			"$52.77",
		);
	});

	test("append a string, if supplied", () => {
		assert.strictEqual(
			helpers.formatCurrencyBase(["$", ".", ""], 64.764376, "M"),
			"$64.76M",
		);
	});

	test("round to any precision", () => {
		assert.strictEqual(
			helpers.formatCurrencyBase(["$", ".", ""], 64363.764376, "M", 5),
			"$64.36376B",
		);
		assert.strictEqual(
			helpers.formatCurrencyBase(["$", ".", ""], 0.794123, "M", 0),
			"$794k",
		);
	});

	test("truncate trailing 0s", () => {
		assert.strictEqual(
			helpers.formatCurrencyBase(["$", ".", ""], 64.99, "M", 2),
			"$64.99M",
		);
		assert.strictEqual(
			helpers.formatCurrencyBase(["$", ".", ""], 64.9, "M", 2),
			"$64.9M",
		);
		assert.strictEqual(
			helpers.formatCurrencyBase(["$", ".", ""], 64.0, "M", 2),
			"$64M",
		);
		assert.strictEqual(
			helpers.formatCurrencyBase(["$", ".", ""], 64, "M", 2),
			"$64M",
		);
	});

	test("large numbers and scientific notation", () => {
		assert.strictEqual(
			helpers.formatCurrencyBase(["$", ".", ""], 64.363, "", 2),
			"$64.36",
		);
		assert.strictEqual(
			helpers.formatCurrencyBase(["$", ".", ""], 64000, "", 2),
			"$64k",
		);
		assert.strictEqual(
			helpers.formatCurrencyBase(["$", ".", ""], 6400000, "", 2),
			"$6.4M",
		);
		assert.strictEqual(
			helpers.formatCurrencyBase(["$", ".", ""], 6400000000, "", 2),
			"$6.4B",
		);
		assert.strictEqual(
			helpers.formatCurrencyBase(["$", ".", ""], 6400000000000, "", 2),
			"$6.4T",
		);
		assert.strictEqual(
			helpers.formatCurrencyBase(["$", ".", ""], 6400000000000000, "", 2),
			"$6.4Q",
		);
		assert.strictEqual(
			helpers.formatCurrencyBase(["$", ".", ""], 6400000000000000000, "", 2),
			"$6.4e18",
		);
		assert.strictEqual(
			helpers.formatCurrencyBase(["$", ".", ""], 64000000000000000000, "", 2),
			"$6.4e19",
		);
	});

	test("large numbers and scientific notation, in millions", () => {
		assert.strictEqual(
			helpers.formatCurrencyBase(["$", ".", ""], 64363, "M", 2),
			"$64.36B",
		);
		assert.strictEqual(
			helpers.formatCurrencyBase(["$", ".", ""], 64363000, "M", 2),
			"$64.36T",
		);
		assert.strictEqual(
			helpers.formatCurrencyBase(["$", ".", ""], 64363000000, "M", 2),
			"$64.36Q",
		);
		assert.strictEqual(
			helpers.formatCurrencyBase(["$", ".", ""], 643630000000, "M", 2),
			"$643.63Q",
		);
		assert.strictEqual(
			helpers.formatCurrencyBase(["$", ".", ""], 6436300000000, "M", 2),
			"$6.44e18",
		);
		assert.strictEqual(
			helpers.formatCurrencyBase(["$", ".", ""], 64363000000000, "M", 2),
			"$6.44e19",
		);
	});

	test("number under 1 with no unit", () => {
		assert.strictEqual(
			helpers.formatCurrencyBase(["$", ".", ""], 0.5, ""),
			"$0.50",
		);
	});

	test("$1000M", () => {
		assert.strictEqual(
			helpers.formatCurrencyBase(["$", ".", ""], 1000, "M"),
			"$1B",
		);
	});

	test("Euros", () => {
		assert.strictEqual(
			helpers.formatCurrencyBase(["", ",", " €"], 64363, "M"),
			"64,36B €",
		);
		assert.strictEqual(helpers.formatCurrencyBase(["", ",", " €"], 0), "0 €");
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

describe("getRelativeType", () => {
	test("should return the correct relative type for a male gender", () => {
		assert.strictEqual(helpers.getRelativeType("male", "brother"), "Brother");
		assert.strictEqual(helpers.getRelativeType("male", "son"), "Son");
		assert.strictEqual(helpers.getRelativeType("male", "father"), "Father");
		assert.strictEqual(
			helpers.getRelativeType("male", "grandfather"),
			"Grandfather",
		);
		assert.strictEqual(helpers.getRelativeType("male", "grandson"), "Grandson");
		assert.strictEqual(helpers.getRelativeType("male", "nephew"), "Nephew");
		assert.strictEqual(helpers.getRelativeType("male", "uncle"), "Uncle");
	});

	test("should return the correct relative type for a female gender", () => {
		assert.strictEqual(helpers.getRelativeType("female", "brother"), "Sister");
		assert.strictEqual(helpers.getRelativeType("female", "son"), "Daughter");
		assert.strictEqual(helpers.getRelativeType("female", "father"), "Mother");
		assert.strictEqual(
			helpers.getRelativeType("female", "grandfather"),
			"Grandmother",
		);
		assert.strictEqual(
			helpers.getRelativeType("female", "grandson"),
			"Granddaughter",
		);
		assert.strictEqual(helpers.getRelativeType("female", "nephew"), "Niece");
		assert.strictEqual(helpers.getRelativeType("female", "uncle"), "Aunt");
	});
});

describe("leagueUrlBase", () => {
	const lid = 123;

	test("valid URLs", () => {
		const scenarios: {
			components: LeagueUrlParts;
			url: string;
		}[] = [
			{
				components: [],
				url: "/l/123",
			},
			{
				components: ["event_log"],
				url: "/l/123/event_log",
			},
			{
				components: ["event_log", "ATL"],
				url: "/l/123/event_log/ATL",
			},
			{
				components: ["event_log", "ATL", 2015],
				url: "/l/123/event_log/ATL/2015",
			},
			{
				components: ["event_log", "ATL", undefined],
				url: "/l/123/event_log/ATL",
			},
			{
				components: ["event_log", undefined],
				url: "/l/123/event_log",
			},
		];
		for (const { components, url } of scenarios) {
			assert.strictEqual(helpers.leagueUrlBase(lid, components), url);
		}
	});

	test("no undefined in the middle", () => {
		// @ts-expect-error
		const parts: LeagueUrlParts = ["event_log", undefined, 2015];
	});
});
