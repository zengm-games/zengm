import assert from "assert";
import { findStarters } from "./rosterAutoSort.basketball";

describe("worker/core/team/rosterAutoSort.basketball/findStarters", () => {
	test("handle easy roster sorts", () => {
		let starters = findStarters([
			"PG",
			"SG",
			"SF",
			"PF",
			"C",
			"G",
			"F",
			"FC",
			"PF",
			"PG",
		]);
		assert.deepStrictEqual(starters, [0, 1, 2, 3, 4]);
		starters = findStarters([
			"PG",
			"SG",
			"G",
			"PF",
			"C",
			"G",
			"F",
			"FC",
			"PF",
			"PG",
		]);
		assert.deepStrictEqual(starters, [0, 1, 2, 3, 4]);
		starters = findStarters([
			"F",
			"SG",
			"SF",
			"PG",
			"C",
			"G",
			"F",
			"FC",
			"PF",
			"PG",
		]);
		assert.deepStrictEqual(starters, [0, 1, 2, 3, 4]);
		starters = findStarters([
			"F",
			"SG",
			"SF",
			"PF",
			"G",
			"G",
			"F",
			"FC",
			"PF",
			"PG",
		]);
		assert.deepStrictEqual(starters, [0, 1, 2, 3, 4]);
	});

	test("put two Gs in starting lineup", () => {
		let starters = findStarters([
			"PG",
			"F",
			"SF",
			"PF",
			"C",
			"G",
			"F",
			"FC",
			"PF",
			"PG",
		]);
		assert.deepStrictEqual(starters, [0, 1, 2, 3, 5]);
		starters = findStarters([
			"F",
			"PF",
			"G",
			"PF",
			"C",
			"G",
			"F",
			"FC",
			"PF",
			"PG",
		]);
		assert.deepStrictEqual(starters, [0, 1, 2, 3, 5]);
		starters = findStarters([
			"F",
			"PF",
			"SF",
			"GF",
			"C",
			"F",
			"FC",
			"PF",
			"PG",
		]);
		assert.deepStrictEqual(starters, [0, 1, 2, 3, 8]);
		starters = findStarters([
			"F",
			"PF",
			"SF",
			"C",
			"C",
			"F",
			"FC",
			"PF",
			"PG",
			"G",
		]);
		assert.deepStrictEqual(starters, [0, 1, 2, 8, 9]);
	});

	test("put two Fs (or one F and one C) in starting lineup", () => {
		let starters = findStarters([
			"PG",
			"SG",
			"G",
			"PF",
			"G",
			"G",
			"F",
			"FC",
			"PF",
			"PG",
		]);
		assert.deepStrictEqual(starters, [0, 1, 2, 3, 6]);
		starters = findStarters([
			"PG",
			"SG",
			"SG",
			"PG",
			"G",
			"G",
			"F",
			"FC",
			"PF",
			"PG",
		]);
		assert.deepStrictEqual(starters, [0, 1, 2, 6, 7]);
		starters = findStarters([
			"PG",
			"SG",
			"SG",
			"PG",
			"C",
			"G",
			"F",
			"FC",
			"PF",
			"PG",
		]);
		assert.deepStrictEqual(starters, [0, 1, 2, 4, 6]);
	});

	test("never put two pure Cs in starting lineup", () => {
		let starters = findStarters([
			"PG",
			"SG",
			"G",
			"C",
			"C",
			"G",
			"F",
			"FC",
			"PF",
			"PG",
		]);
		assert.deepStrictEqual(starters, [0, 1, 2, 3, 6]);
		starters = findStarters([
			"PG",
			"SG",
			"G",
			"C",
			"FC",
			"G",
			"F",
			"FC",
			"PF",
			"PG",
		]);
		assert.deepStrictEqual(starters, [0, 1, 2, 3, 4]);
	});
});
