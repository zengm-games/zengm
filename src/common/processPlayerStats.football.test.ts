import { assert, test } from "vitest";
import {
	compileStats,
	processStats,
	statFunctions,
} from "./processPlayerStats.football.ts";
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

test("compiled requests match direct projection across formulas, missing stats, and metadata", () => {
	const keys = [
		...footballStats.raw,
		...footballStats.derived,
		...Object.keys(statFunctions),
		"jerseyNumber",
		"custom",
		"missing",
	];
	let seed = 517239;
	const random = () => {
		seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
		return seed / 4294967296;
	};
	const requests = [
		keys,
		["gp", "av"],
		["keyStats"],
		["toString", "jerseyNumber", "missing"],
	];
	for (const fantasy of ["standard", "ppr", "halfPpr"] as const) {
		for (const stats of requests) {
			const run = compileStats(stats, () => fantasy);
			for (let i = 0; i < 36; i++) {
				const input: any = Object.fromEntries(
					keys.map((key) => [key, Math.floor(random() * 100)]),
				);
				input.season = 2016;
				input.playoffs = i % 3 === 0 ? "combined" : i % 2 === 0;
				input.hasTot = i % 4 === 0;
				if (i % 3 === 0) {
					for (let j = 0; j < keys.length; j += 5) {
						input[keys[j]!] = [undefined, Number.NaN, Infinity, -Infinity, -0][
							(j / 5) % 5
						];
					}
				}
				const before = structuredClone(input);
				const expected = processStats(input, stats, 1990, () => fantasy);
				const actual = run(input, 1990);
				assert.deepEqual(actual, expected);
				assert.deepEqual(Object.keys(actual), Object.keys(expected));
				assert.deepEqual(input, before);
			}
		}
	}
});

test("compiled requests preserve duplicate keys and evaluate current fantasy settings", () => {
	const input = {
		...makeStats(),
		rec: 8,
		jerseyNumber: undefined,
		hasTot: true,
	};
	let mode: "ppr" | "halfPpr" = "ppr";
	let calls = 0;
	const getFantasy = () => {
		calls += 1;
		return mode;
	};
	const stats = ["gp", "fp", "gp", "fp", "toString", "jerseyNumber"];
	const run = compileStats(stats, getFantasy);
	const first = run(input, 1990);
	assert.deepEqual(
		first,
		processStats(input, stats, 1990, () => mode),
	);
	mode = "halfPpr";
	input.gp = 3;
	const second = run(input, 1990);
	assert.deepEqual(
		second,
		processStats(input, stats, 1990, () => mode),
	);
	assert.notStrictEqual(first, second);
	assert.strictEqual(first.gp, 2);
	assert.strictEqual(calls, 4);
	assert.strictEqual(second.hasTot, true);
	assert.strictEqual(second.playoffs, false);
	assert.strictEqual(second.jerseyNumber, undefined);
	assert.strictEqual(second.toString, "[object Object]");
	compileStats(["gp"], getFantasy)(input, 1990);
	assert.strictEqual(calls, 4);
	assert.throws(
		() => compileStats(["age"], getFantasy)(input, undefined),
		/bornYear/,
	);
	const invalid = compileStats(["__proto__"], getFantasy);
	assert.throws(() => invalid(input, 1990), TypeError);
});
