import { assert, test } from "vitest";
import { processStats } from "./processPlayerStats.football.ts";
import footballStats from "../worker/core/player/stats.football.ts";

const makeStats = () => ({
	...Object.fromEntries(
		[...footballStats.raw, ...footballStats.derived].map((key) => [key, 0]),
	),
	season: 2016,
	playoffs: false,
	gp: 2,
	pss: 10,
	pssCmp: 6,
	pssYds: 135,
	pssTD: 2,
	pssInt: 1,
});

test("projects raw and derived football values without changing input", () => {
	const input = makeStats();
	const before = structuredClone(input);
	assert.deepEqual(
		processStats(
			input,
			new Set(["pssYds", "cmpPct", "pssYdsPerAtt", "age"]),
			1990,
			() => "standard",
		),
		{ pssYds: 135, cmpPct: 60, pssYdsPerAtt: 13.5, age: 26, playoffs: false },
	);
	assert.deepEqual(input, before);
});

test("normalizes only undefined and NaN and retains jersey and range metadata", () => {
	const input = {
		...makeStats(),
		pss: 0,
		pssCmp: 0,
		custom: Number.NaN,
		negativeZero: -0,
		infinite: Infinity,
		nil: null,
		jerseyNumber: undefined,
		hasTot: true,
	};
	const output = processStats(
		input,
		[
			"cmpPct",
			"custom",
			"missing",
			"negativeZero",
			"infinite",
			"nil",
			"jerseyNumber",
		],
		undefined,
		() => "standard",
	);
	assert.strictEqual(output.cmpPct, 0);
	assert.strictEqual(output.custom, 0);
	assert.strictEqual(output.missing, 0);
	assert(Object.is(output.negativeZero, -0));
	assert.strictEqual(output.infinite, Infinity);
	assert.strictEqual(output.nil, null);
	assert.strictEqual(output.jerseyNumber, undefined);
	assert.strictEqual(output.playoffs, false);
	assert.strictEqual(output.hasTot, true);
});

test("fantasy-point settings are read only for requested fantasy stats", () => {
	const input = { ...makeStats(), rec: 8 };
	let calls = 0;
	const getFantasyPoints = () => {
		calls += 1;
		return "ppr" as const;
	};
	processStats(input, ["pssYds"], undefined, getFantasyPoints);
	assert.strictEqual(calls, 0);
	const standard = processStats(input, ["fp"], undefined, () => "standard");
	const ppr = processStats(input, ["fp"], undefined, getFantasyPoints);
	assert.strictEqual(ppr.fp, standard.fp + 8);
	assert.strictEqual(calls, 1);
	assert.throws(
		() => processStats(input, ["age"], undefined, getFantasyPoints),
		/bornYear/,
	);
});
