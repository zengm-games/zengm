import { describe, expect, test } from "vitest";
import {
	countPickablePlayers,
	getLockedCount,
	getPickValidationError,
} from "./eightyTwoZeroDraftHelpers.ts";

const players = [
	{ srID: "a" },
	{ srID: "b" },
	{ srID: "c" },
	{ srID: "d" },
	{ srID: "e" },
	{ srID: "f" },
	{ srID: "g" },
	{ srID: "h" },
	{ srID: "i" },
	{ srID: "j" },
	{ srID: "k" },
	{ srID: "l" },
];

describe("getLockedCount", () => {
	test("locks one more top player every two rounds", () => {
		expect(getLockedCount(1)).toBe(0);
		expect(getLockedCount(2)).toBe(0);
		expect(getLockedCount(3)).toBe(1);
		expect(getLockedCount(4)).toBe(1);
		expect(getLockedCount(12)).toBe(5);
	});
});
describe("getPickValidationError", () => {
	test("rejects duplicate srID picks", () => {
		expect(
			getPickValidationError({
				lockedCount: 0,
				pickIndex: 1,
				picks: [{ p: { srID: "b" } }],
				players,
			}),
		).toBe("You already drafted this player");
	});

	test("rejects out-of-range picks", () => {
		expect(
			getPickValidationError({
				lockedCount: 0,
				pickIndex: 12,
				picks: [],
				players,
			}),
		).toBe("Invalid player");
	});

	test("rejects locked picks", () => {
		expect(
			getPickValidationError({
				lockedCount: getLockedCount(5),
				pickIndex: 1,
				picks: [],
				players,
			}),
		).toBe("This player is locked");
	});
});

describe("countPickablePlayers", () => {
	test("counts only unlocked non-duplicate players", () => {
		expect(
			countPickablePlayers(players.slice(0, 5), 3, [{ p: { srID: "d" } }]),
		).toBe(1);
	});
});
