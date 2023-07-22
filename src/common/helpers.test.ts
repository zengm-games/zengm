import assert from "node:assert/strict";
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
			assert.strictEqual(helpers.formatCurrency(64.764376, "M"), "$64.76M");
		});

		test("round to any precision", () => {
			assert.strictEqual(
				helpers.formatCurrency(64363.764376, "M", 5),
				"$64.36376B",
			);
			assert.strictEqual(helpers.formatCurrency(0.794123, "M", 0), "$794k");
		});

		test("truncate trailing 0s", () => {
			assert.strictEqual(helpers.formatCurrency(64.99, "M", 2), "$64.99M");
			assert.strictEqual(helpers.formatCurrency(64.9, "M", 2), "$64.9M");
			assert.strictEqual(helpers.formatCurrency(64.0, "M", 2), "$64M");
			assert.strictEqual(helpers.formatCurrency(64, "M", 2), "$64M");
		});

		test("large numbers and scientific notation", () => {
			assert.strictEqual(helpers.formatCurrency(64.363, "", 2), "$64.36");
			assert.strictEqual(helpers.formatCurrency(64000, "", 2), "$64k");
			assert.strictEqual(helpers.formatCurrency(6400000, "", 2), "$6.4M");
			assert.strictEqual(helpers.formatCurrency(6400000000, "", 2), "$6.4B");
			assert.strictEqual(helpers.formatCurrency(6400000000000, "", 2), "$6.4T");
			assert.strictEqual(
				helpers.formatCurrency(6400000000000000, "", 2),
				"$6.4Q",
			);
			assert.strictEqual(
				helpers.formatCurrency(6400000000000000000, "", 2),
				"$6.4e18",
			);
			assert.strictEqual(
				helpers.formatCurrency(64000000000000000000, "", 2),
				"$6.4e19",
			);
		});

		test("large numbers and scientific notation, in millions", () => {
			assert.strictEqual(helpers.formatCurrency(64363, "M", 2), "$64.36B");
			assert.strictEqual(helpers.formatCurrency(64363000, "M", 2), "$64.36T");
			assert.strictEqual(
				helpers.formatCurrency(64363000000, "M", 2),
				"$64.36Q",
			);
			assert.strictEqual(
				helpers.formatCurrency(643630000000, "M", 2),
				"$643.63Q",
			);
			assert.strictEqual(
				helpers.formatCurrency(6436300000000, "M", 2),
				"$6.44e18",
			);
			assert.strictEqual(
				helpers.formatCurrency(64363000000000, "M", 2),
				"$6.44e19",
			);
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
		it("should return the correct relative type for a male gender", () => {
			expect(helpers.getRelativeType("male", "brother")).toBe("Brother");
			expect(helpers.getRelativeType("male", "son")).toBe("Son");
			expect(helpers.getRelativeType("male", "father")).toBe("Father");
			expect(helpers.getRelativeType("male", "grandfather")).toBe(
				"Grandfather",
			);
			expect(helpers.getRelativeType("male", "grandson")).toBe("Grandson");
			expect(helpers.getRelativeType("male", "nephew")).toBe("Nephew");
			expect(helpers.getRelativeType("male", "uncle")).toBe("Uncle");
		});

		it("should return the correct relative type for a female gender", () => {
			expect(helpers.getRelativeType("female", "brother")).toBe("Sister");
			expect(helpers.getRelativeType("female", "son")).toBe("Daughter");
			expect(helpers.getRelativeType("female", "father")).toBe("Mother");
			expect(helpers.getRelativeType("female", "grandfather")).toBe(
				"Grandmother",
			);
			expect(helpers.getRelativeType("female", "grandson")).toBe(
				"Granddaughter",
			);
			expect(helpers.getRelativeType("female", "nephew")).toBe("Niece");
			expect(helpers.getRelativeType("female", "uncle")).toBe("Aunt");
		});
	});

	describe("leagueUrlFactory", () => {
		it("should construct a valid URL with components", () => {
			const lid = 123;
			const components = ["team", 45, "roster", undefined, "stats"];
			const expectedUrl = "/l/123/team/45/roster/stats";
			expect(helpers.leagueUrlFactory(lid, components)).toBe(expectedUrl);
		});

		it("should construct a valid URL without undefined components", () => {
			const lid = 456;
			const components = ["players", undefined, "schedule", "results"];
			const expectedUrl = "/l/456/players/schedule/results";
			expect(helpers.leagueUrlFactory(lid, components)).toBe(expectedUrl);
		});

		it("should construct a valid URL with only the league ID", () => {
			const lid = 789;
			const components: (number | string | undefined)[] = [];
			const expectedUrl = "/l/789";
			expect(helpers.leagueUrlFactory(lid, components)).toBe(expectedUrl);
		});
	});
});
