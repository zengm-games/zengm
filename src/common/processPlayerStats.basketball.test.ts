import { assert, test } from "vitest";
import { processStats } from "./processPlayerStats.basketball.ts";

test.each([false, true])(
	"preserves partial historical totals and per-36 values (keep=%s)",
	(keep) => {
		const input = {
			season: 1962,
			playoffs: false,
			hasTot: true,
			gp: 82,
			min: 2460,
			pts: 1640,
			fg: 700,
			fga: 1400,
			trb: 410,
		};
		const before = structuredClone(input);
		const stats = ["pts", "min", "2p", "2pa", "fgp", "trb", "orb", "tp", "age"];
		assert.deepEqual(processStats(input, stats, "totals", 1940, keep), {
			pts: 1640,
			min: 2460,
			"2p": 700,
			"2pa": 1400,
			fgp: 50,
			trb: 410,
			orb: undefined,
			tp: undefined,
			age: 22,
			playoffs: false,
			hasTot: true,
		});
		assert.deepEqual(processStats(input, stats, "per36", 1940, keep), {
			pts: 24,
			min: 30,
			"2p": (700 * 36) / 2460,
			"2pa": (1400 * 36) / 2460,
			fgp: 50,
			trb: 6,
			orb: undefined,
			tp: undefined,
			age: 22,
			playoffs: false,
			hasTot: true,
		});
		assert.deepEqual(input, before);
	},
);

test.each([undefined, false, true])(
	"only fills empty-row missing values when requested (keep=%s)",
	(keep) => {
		const input = { jerseyNumber: "00", yearsWithTeam: 0 };
		const output = processStats(
			input,
			["pts", "fgp", "jerseyNumber", "yearsWithTeam"],
			"totals",
			undefined,
			keep,
		);
		assert.deepEqual(output, {
			pts: keep ? 0 : undefined,
			fgp: keep ? 0 : undefined,
			jerseyNumber: "00",
			yearsWithTeam: 0,
			playoffs: undefined,
		});
		const missingJersey = processStats(
			{},
			["jerseyNumber"],
			"totals",
			undefined,
			keep,
		);
		assert.strictEqual(missingJersey.jerseyNumber, undefined);
	},
);

test.each([false, true])(
	"retains special numeric values and requires bornYear only for age (keep=%s)",
	(keep) => {
		const input = {
			playoffs: false,
			season: 2026,
			gp: 0,
			min: 0,
			negativeZero: -0,
			infinite: Infinity,
			nil: null,
			invalid: Number.NaN,
		};
		const output = processStats(
			input,
			["negativeZero", "infinite", "nil", "invalid", "missing"],
			"totals",
			undefined,
			keep,
		);
		assert(Object.is(output.negativeZero, -0));
		assert.strictEqual(output.infinite, Infinity);
		assert.strictEqual(output.nil, null);
		assert.strictEqual(output.invalid, undefined);
		assert.strictEqual(output.missing, undefined);
		assert.throws(
			() => processStats(input, ["age"], "totals", undefined, keep),
			/bornYear/,
		);
		assert.strictEqual(
			processStats(input, ["age"], "totals", 2000, keep).age,
			26,
		);
		assert.strictEqual(
			processStats(input, ["infinite"], "per36", undefined, keep).infinite,
			undefined,
		);
	},
);

test("uses each stat's historical games/minutes and does not change request order", () => {
	const input = {
		playoffs: "combined",
		hasTot: true,
		gp: 10,
		min: 300,
		pts: 100,
		trb: 20,
		drb: 10,
		orb: 5,
	};
	const sums = {
		pts: { gp: 5, min: 180 },
		trb: { gp: 4, min: 120 },
		drb: { gp: 6, min: 180 },
	};
	const stats = ["trb", "pts", "trb"];
	const perGame = processStats(input, stats, "perGame", undefined, true, sums);
	assert.deepEqual(perGame, {
		trb: 3.5,
		pts: 20,
		playoffs: "combined",
		hasTot: true,
	});
	assert.deepEqual(Object.keys(perGame), ["trb", "pts", "playoffs", "hasTot"]);
	assert.deepEqual(processStats(input, stats, "per36", undefined, true, sums), {
		trb: 10.5,
		pts: 20,
		playoffs: "combined",
		hasTot: true,
	});
});
