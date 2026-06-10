import { describe, expect, test } from "vitest";
import {
	countPickablePlayers,
	getDisabledCount,
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

describe("getDisabledCount", () => {
	test("locks one more top player each round", () => {
		expect(getDisabledCount(1)).toBe(0);
		expect(getDisabledCount(4)).toBe(3);
		expect(getDisabledCount(12)).toBe(11);
	});
});

describe("getPickValidationError", () => {
	test("rejects duplicate srID picks", () => {
		expect(
			getPickValidationError({
				disabledCount: 0,
				pickIndex: 1,
				picks: [{ p: { srID: "b" } }],
				players,
			}),
		).toBe("You already drafted this player");
	});

	test("rejects out-of-range picks", () => {
		expect(
			getPickValidationError({
				disabledCount: 0,
				pickIndex: 12,
				picks: [],
				players,
			}),
		).toBe("Invalid player");
	});

	test("rejects locked picks", () => {
		expect(
			getPickValidationError({
				disabledCount: getDisabledCount(4),
				pickIndex: 2,
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
