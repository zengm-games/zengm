import { describe, expect, test } from "vitest";
import { countPickablePlayers } from "./eightyTwoZeroDraftHelpers.ts";

const players = [
	{ p: { srID: "a" }, locked: true },
	{ p: { srID: "b" }, locked: true },
	{ p: { srID: "c" }, locked: true },
	{ p: { srID: "d" }, locked: false },
	{ p: { srID: "e" }, locked: false },
];

describe("countPickablePlayers", () => {
	test("counts only unlocked non-duplicate players", () => {
		expect(countPickablePlayers(players, [{ p: { srID: "d" } }])).toBe(1);
	});
});
