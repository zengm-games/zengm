import { describe, expect, it } from "vitest";
import { awardSettingsSchema } from "../../../../common/types.ts";
import { applyBenchPenalty, selectBasketballTeams } from "./basketballTeamSelection.ts";

describe("basketball team award settings", () => {
	const award = { name: "Custom", shortName: "CUSTOM", formula: "pts", showStats: "offense", numTeams: 4, group: "conf", positionalSelection: true, benchPenalty: true };
	it("preserves custom formulas, grouping and arbitrary team counts", () => {
		expect(awardSettingsSchema.parse([award])[0]).toEqual(award);
	});
	it("rejects invalid flags and strips team-only selection settings from individual awards", () => {
		expect(awardSettingsSchema.safeParse([{ ...award, benchPenalty: 1 }]).success).toBe(false);
		expect(awardSettingsSchema.safeParse([{ ...award, positionalSelection: "yes" }]).success).toBe(false);
		const parsedIndividual = awardSettingsSchema.parse([{ ...award, numTeams: undefined }])[0];
		expect(parsedIndividual).not.toHaveProperty("positionalSelection");
		expect(parsedIndividual).not.toHaveProperty("benchPenalty");
	});
});

describe("basketball team selection", () => {
	const make = (positions: string[]) => positions.map((pos, pid) => ({ pos, pid, score: 100 - pid }));
	it("reserves flexible players to complete a lineup without duplication", () => {
		const players = make(["GF", "PG", "SG", "FC", "PF"]);
		const teams = selectBasketballTeams(players, 1, p => p.score);
		expect(teams[0]!.map(p => p.pos)).toEqual(["PG", "SG", "GF", "PF", "FC"]);
		expect(new Set(teams.flat().map(p => p.pid)).size).toBe(5);
	});
	it("supports more than three teams and sparse-position fallbacks", () => {
		const players = make(Array(22).fill("PG"));
		const teams = selectBasketballTeams(players, 5, p => p.score);
		expect(teams.map(team => team.length)).toEqual([5, 5, 5, 5, 2]);
		expect(new Set(teams.flat().map(p => p.pid)).size).toBe(22);
	});
	it("excludes nonfinite scores and returns empty placeholder teams", () => {
		expect(selectBasketballTeams(make(["C"]), 2, () => -Infinity)).toEqual([[], []]);
	});
});

describe("bench penalty", () => {
	it("uses the 75% starting threshold and preserves missing historical GS", () => {
		expect(applyBenchPenalty(100, { gp: 80, gs: 60 })).toBe(100);
		expect(applyBenchPenalty(100, { gp: 80, gs: 30 })).toBe(50);
		expect(applyBenchPenalty(100, { gp: 80, gs: 0 })).toBe(0);
		expect(applyBenchPenalty(100, { gp: 80 })).toBe(100);
		expect(applyBenchPenalty(100, { gp: 0, gs: 0 })).toBe(100);
	});
	it("does not promote negative or ineligible custom formula scores", () => {
		expect(applyBenchPenalty(-100, { gp: 80, gs: 30 })).toBe(-150);
		expect(applyBenchPenalty(-Infinity, { gp: 80, gs: 0 })).toBe(-Infinity);
	});
});
