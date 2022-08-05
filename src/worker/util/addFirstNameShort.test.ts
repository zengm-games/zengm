import assert from "node:assert/strict";
import addFirstNameShort from "./addFirstNameShort";

describe("worker/util/addFirstNameShort", () => {
	test("does nothing if last names are not the same", () => {
		const players = [
			{
				firstName: "Bob",
				lastName: "Anderson",
			},
			{
				firstName: "Barry",
				lastName: "Smith",
			},
		];

		const players2 = addFirstNameShort(players);

		assert.strictEqual(players2[0].firstNameShort, "B.");
		assert.strictEqual(players2[1].firstNameShort, "B.");
	});

	test("shortens to one letter if possible", () => {
		const players = [
			{
				firstName: "Bob",
				lastName: "Anderson",
			},
			{
				firstName: "Sam",
				lastName: "Anderson",
			},
		];

		const players2 = addFirstNameShort(players);

		assert.strictEqual(players2[0].firstNameShort, "B.");
		assert.strictEqual(players2[1].firstNameShort, "S.");
	});

	test("shortens to two letters if possible", () => {
		const players = [
			{
				firstName: "Bobby",
				lastName: "Anderson",
			},
			{
				firstName: "Barry",
				lastName: "Anderson",
			},
		];

		const players2 = addFirstNameShort(players);

		assert.strictEqual(players2[0].firstNameShort, "Bo.");
		assert.strictEqual(players2[1].firstNameShort, "Ba.");
	});

	test("uses full name if shorter than the length needed to distinguish", () => {
		const players = [
			{
				firstName: "Bob",
				lastName: "Anderson",
			},
			{
				firstName: "Borry",
				lastName: "Anderson",
			},
		];

		const players2 = addFirstNameShort(players);

		assert.strictEqual(players2[0].firstNameShort, "Bob");
		assert.strictEqual(players2[1].firstNameShort, "Bor.");
	});

	test("uses full name if the period would be on the last letter of the name", () => {
		const players = [
			{
				firstName: "Bob",
				lastName: "Anderson",
			},
			{
				firstName: "Bobby",
				lastName: "Anderson",
			},
		];

		const players2 = addFirstNameShort(players);

		assert.strictEqual(players2[0].firstNameShort, "Bob");
		assert.strictEqual(players2[1].firstNameShort, "Bobby");
	});

	test("shortens to one letter if names are identical", () => {
		const players = [
			{
				firstName: "Bob",
				lastName: "Anderson",
			},
			{
				firstName: "Bob",
				lastName: "Anderson",
			},
		];

		const players2 = addFirstNameShort(players);

		assert.strictEqual(players2[0].firstNameShort, "B.");
		assert.strictEqual(players2[1].firstNameShort, "B.");
	});

	test("handles only some players with colliding first names", () => {
		const players = [
			{
				firstName: "Robert",
				lastName: "Anderson",
			},
			{
				firstName: "Roberta",
				lastName: "Anderson",
			},
			{
				firstName: "Bob",
				lastName: "Anderson",
			},
		];

		const players2 = addFirstNameShort(players);

		assert.strictEqual(players2[0].firstNameShort, "Robert");
		assert.strictEqual(players2[1].firstNameShort, "Roberta");
		assert.strictEqual(players2[2].firstNameShort, "B.");
	});

	test("consistently handle names under 2 characters", () => {
		const players = [
			{
				firstName: "Aa",
				lastName: "Anderson",
			},
			{
				firstName: "Ab",
				lastName: "Anderson",
			},
			{
				firstName: "Aa",
				lastName: "Smith",
			},
		];

		const players2 = addFirstNameShort(players);

		assert.strictEqual(players2[0].firstNameShort, "Aa");
		assert.strictEqual(players2[1].firstNameShort, "Ab");
		assert.strictEqual(players2[2].firstNameShort, "Aa");
	});

	test('crazy test case from "not sure what my deal is#4505"', () => {
		const players = [
			{
				firstName: "JzzyP",
				lastName: "Smith",
			},
			{
				firstName: "JzyPhat",
				lastName: "Smith",
			},
			{
				firstName: "Jzz",
				lastName: "Smith",
			},
			{
				firstName: "JyP ",
				lastName: "Smith",
			},
			{
				firstName: "JzyyP",
				lastName: "Smith",
			},
		];

		const players2 = addFirstNameShort(players);

		// 0 should actually should go one more letter, to distinguish from Jzz
		assert.strictEqual(players2[0].firstNameShort, "Jzz.");
		assert.strictEqual(players2[1].firstNameShort, "JzyP.");
		assert.strictEqual(players2[2].firstNameShort, "Jzz");
		assert.strictEqual(players2[3].firstNameShort, "Jy.");
		assert.strictEqual(players2[4].firstNameShort, "JzyyP");
	});
});
