import { describe, expect, test } from "vitest";
import { countPickablePlayers } from "./eightyTwoZeroDraftHelpers.ts";

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

describe("countPickablePlayers", () => {
	test("counts only unlocked non-duplicate players", () => {
		expect(
			countPickablePlayers(players.slice(0, 5), 3, [{ p: { srID: "d" } }]),
		).toBe(1);
	});
});
