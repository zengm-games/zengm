import { assert, beforeEach, test, vi } from "vitest";
import { DEFAULT_LEVEL } from "../../../common/budgetLevels.ts";
import { PHASE } from "../../../common/constants.ts";
import type { Player } from "../../../common/types.ts";
import { resetG } from "../../../test/helpers.ts";
import { player } from "../../core/index.ts";
import { g } from "../../util/index.ts";
import getCopies from "./playersPlus.ts";
import { idb } from "../index.ts";

let p: Player;
beforeEach(() => {
	resetG();
	g.setWithoutSavingToDB("phase", PHASE.PLAYOFFS);
	p = { ...player.generate(0, 25, 2010, true, DEFAULT_LEVEL), pid: 0 };
	player.addStatsRow(p, 2016, false);
	const template = p.stats[0];
	p.stats = [
		{
			...template,
			season: 2015,
			tid: 0,
			gp: 2,
			av: 3,
			pssLng: 90,
			pss: 10,
			pssCmp: 5,
		},
		{
			...template,
			season: 2016,
			tid: 1,
			gp: 3,
			av: 5,
			pssLng: 70,
			pss: 30,
			pssCmp: 20,
		},
		{
			...template,
			season: 2016,
			tid: 0,
			gp: 1,
			av: 7,
			pssLng: 80,
			pss: 5,
			pssCmp: 4,
		},
		{
			...template,
			season: 2016,
			tid: 0,
			playoffs: true,
			gp: 2,
			av: 20,
			pssLng: 60,
			pss: 10,
			pssCmp: 8,
		},
	];
});

test("raw career requests preserve traded totals, longest plays, and range metadata", async () => {
	const before = structuredClone(p);
	const [output] = await getCopies([p], {
		stats: ["season", "tid", "gp", "av", "pssLng"],
		regularSeason: true,
		playoffs: true,
		combined: true,
		mergeStats: "totOnly",
	});
	assert(output);
	assert.strictEqual(output.careerStats.gp, 6);
	assert.strictEqual(output.careerStats.av, 15);
	assert.strictEqual(output.careerStats.pssLng, 90);
	assert.strictEqual(output.careerStatsPlayoffs.av, 20);
	assert.strictEqual(output.careerStatsCombined.av, 35);
	assert.strictEqual(output.careerStatsCombined.gp, 8);
	assert.deepEqual(p, before);
});

test("a derived request retains all formula inputs for season and career totals", async () => {
	const [output] = await getCopies([p], {
		stats: ["av", "cmpPct"],
		mergeStats: "totOnly",
	});
	assert(output);
	assert.strictEqual(output.careerStats.av, 15);
	assert.strictEqual(output.careerStats.cmpPct, (29 / 45) * 100);
	assert.strictEqual(output.stats[1].cmpPct, (24 / 35) * 100);
});

test("raw aggregation retains historical missing-stat and zero-game-trade behavior", async () => {
	delete p.stats[2].av;
	p.stats.splice(3, 0, { ...p.stats[2], tid: 2, gp: 0 });
	const [output] = await getCopies([p], {
		stats: ["av", "gp", "pssLng"],
		season: 2016,
		mergeStats: "totOnly",
	});
	assert(output);
	// The last played stint does not have AV, so the original merger omits it.
	assert.strictEqual(output.stats.av, 0);
	assert.strictEqual(output.stats.gp, 4);
	assert.strictEqual(output.stats.pssLng, 80);
});

test("each request uses the current stat list when a caller reuses and edits its array", async () => {
	const stats = ["av"];
	const [first] = await getCopies([p], { stats });
	assert(first);
	assert.strictEqual(first.careerStats.av, 15);
	stats.splice(0, stats.length, "gp", "cmpPct");
	const [second] = await getCopies([p], { stats });
	assert(second);
	assert.strictEqual(second.careerStats.gp, 6);
	assert.strictEqual(second.careerStats.cmpPct, (29 / 45) * 100);
	assert.isFalse(Object.hasOwn(second.careerStats, "av"));
	assert.isFalse(Object.hasOwn(first.careerStats, "cmpPct"));
});

test("projections retain metadata and isolate nested returned stats", async () => {
	for (const row of p.stats) {
		row.customMax = null;
	}
	p.stats[0].customMax = [12, { nested: [1, 2] }];
	p.stats[0].hasTot = true;
	const before = structuredClone(p);
	const [output] = await getCopies([p], {
		stats: ["season", "customMax"],
		regularSeason: true,
		playoffs: true,
	});
	assert(output);
	assert.strictEqual(output.stats[0].hasTot, true);
	assert.strictEqual(output.stats[0].playoffs, false);
	assert.strictEqual(output.stats.at(-1).playoffs, true);
	assert.notStrictEqual(output.stats[0].customMax, p.stats[0].customMax);
	assert.notStrictEqual(output.stats[0].customMax[1], p.stats[0].customMax[1]);
	assert.notStrictEqual(
		output.careerStats.customMax[1],
		p.stats[0].customMax[1],
	);
	output.stats[0].customMax[1].nested[0] = 99;
	assert.deepEqual(output.careerStats.customMax[1], { nested: [1, 2] });
	output.careerStats.customMax[1].nested.push(3);
	assert.deepEqual(p, before);
});

test("uses the current request after awaiting abbreviation loading", async () => {
	let release!: () => void;
	const gate = new Promise<void>((resolve) => {
		release = resolve;
	});
	const lookup = vi
		.spyOn(idb.getCopy, "teamSeasons")
		.mockImplementation(async ({ season, tid }) => {
			await gate;
			return { abbrev: `${season}:${tid}` } as any;
		});
	try {
		const stats = ["abbrev", "av"];
		const pending = getCopies([p], {
			stats,
			season: 2016,
			mergeStats: "totOnly",
		});
		assert.strictEqual(lookup.mock.calls.length, 1);
		stats.splice(1, 1, "cmpPct", "gp");
		release();
		const [output] = await pending;
		assert(output);
		assert.strictEqual(output.stats.abbrev, "2016:0");
		assert.strictEqual(output.stats.cmpPct, (24 / 35) * 100);
		assert.strictEqual(output.stats.gp, 4);
		assert.isFalse(Object.hasOwn(output.stats, "av"));
	} finally {
		release();
		lookup.mockRestore();
	}
});
