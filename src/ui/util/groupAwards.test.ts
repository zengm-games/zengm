import { assert, test } from "vitest";
import type { PlayerAward } from "../../common/types.ts";
import { groupAwards } from "./groupAwards.ts";

test("works with built-in awards", () => {
	const awards: PlayerAward[] = [
		{
			season: 2025,
			name: "Most Valuable Player",
			shortName: "MVP",
			index: 0,
			rank: 1,
		},
		{
			season: 2026,
			name: "Most Valuable Player",
			shortName: "MVP",
			index: 0,
			rank: 1,
		},
		{
			season: 2025,
			name: "Defensive Player of the Year",
			shortName: "DPOY",
			index: 1,
			rank: 1,
		},
	];

	const grouped = groupAwards(awards);

	assert.deepStrictEqual(grouped, [
		{
			type: "Most Valuable Player",
			long: "Most Valuable Player",
			count: 2,
			seasons: { "Most Valuable Player": ["2025-26"] },
			averageIndex: 0,
		},
		{
			type: "Defensive Player of the Year",
			long: "Defensive Player of the Year",
			count: 1,
			seasons: { "Defensive Player of the Year": ["2025"] },
			averageIndex: 1,
		},
	]);
});

test("skips lower ranks", () => {
	const awards: PlayerAward[] = [
		{
			season: 2025,
			name: "Most Valuable Player",
			shortName: "MVP",
			index: 0,
			rank: 1,
		},
		{
			season: 2026,
			name: "Most Valuable Player",
			shortName: "MVP",
			index: 0,
			rank: 1,
		},
		{
			season: 2025,
			name: "Defensive Player of the Year",
			shortName: "DPOY",
			index: 1,
			rank: 2,
		},
	];

	const grouped = groupAwards(awards);

	assert.deepStrictEqual(grouped, [
		{
			type: "Most Valuable Player",
			long: "Most Valuable Player",
			count: 2,
			seasons: { "Most Valuable Player": ["2025-26"] },
			averageIndex: 0,
		},
	]);
});

test("works with simple awards", () => {
	const awards: PlayerAward[] = [
		{
			season: 2025,
			type: "Most Valuable Player",
		},
		{
			season: 2026,
			type: "Most Valuable Player",
		},
		{
			season: 2025,
			type: "Defensive Player of the Year",
		},
	];

	const grouped = groupAwards(awards);

	assert.deepStrictEqual(grouped, [
		{
			type: "Most Valuable Player",
			long: "Most Valuable Player",
			count: 2,
			seasons: { "Most Valuable Player": ["2025-26"] },
		},
		{
			type: "Defensive Player of the Year",
			long: "Defensive Player of the Year",
			count: 1,
			seasons: { "Defensive Player of the Year": ["2025"] },
		},
	]);
});

test("works with both combined", () => {
	const awards: PlayerAward[] = [
		{
			season: 2025,
			name: "Most Valuable Player",
			shortName: "MVP",
			index: 0,
			rank: 1,
		},
		{
			season: 2026,
			type: "Most Valuable Player",
		},
	];

	const grouped = groupAwards(awards);

	assert.deepStrictEqual(grouped, [
		{
			type: "Most Valuable Player",
			long: "Most Valuable Player",
			count: 2,
			seasons: { "Most Valuable Player": ["2025-26"] },
			averageIndex: 0,
		},
	]);
});

test("works with both combined for custom award type", () => {
	const awards: PlayerAward[] = [
		{
			season: 2025,
			name: "Foo",
			shortName: "FOO",
			index: 0,
			rank: 1,
		},
		{
			season: 2026,
			type: "Foo",
		},
	];

	const grouped = groupAwards(awards);

	assert.deepStrictEqual(grouped, [
		{
			type: "Foo",
			long: "Foo",
			count: 2,
			seasons: { Foo: ["2025-26"] },
			averageIndex: 0,
		},
	]);
});

test("works with All-Star", () => {
	const awards: PlayerAward[] = [
		{
			season: 2025,
			type: "All-Star",
		},
	];

	const grouped = groupAwards(awards);

	assert.deepStrictEqual(grouped, [
		{
			type: "All-Star",
			long: "All-Star",
			count: 1,
			seasons: { "All-Star": ["2025"] },
		},
	]);
});
