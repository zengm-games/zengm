import assert from "assert";
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
});
