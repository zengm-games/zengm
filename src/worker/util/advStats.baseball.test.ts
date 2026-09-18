/* eslint-disable no-sparse-arrays -- Sparse imported stat arrays are regression fixtures. */
import { assert, test } from "vitest";
import { getPlayersForWAR, playerStatsForWAR } from "./advStats.baseball.ts";
import { player } from "../core/index.ts";
import { idb } from "../db/index.ts";
import { g } from "./index.ts";
import { resetG } from "../../test/helpers.ts";
import { DEFAULT_LEVEL } from "../../common/budgetLevels.ts";
import type { Player } from "../../common/types.ts";
import statsRowIsCurrent from "../core/player/statsRowIsCurrent.ts";

test("latest WAR rows match generic selection for trades, missing data, zero games and playoffs", async () => {
	resetG();
	g.setWithoutSavingToDB("season", 2026);
	const template = player.generate(0, 25, 2020, true, DEFAULT_LEVEL);
	player.addStatsRow(template, 2026, false);
	const row = (values: Record<string, unknown>) => ({
		...structuredClone(template.stats.at(-1)),
		...values,
	});
	const fixtures: any[][] = [
		[row({ h: 7, gp: 3, pa: 20 })],
		[],
		[
			row({ season: 2025, gp: 30 }),
			row({ tid: 3, h: 10 }),
			row({ tid: 0, h: 5 }),
			row({ playoffs: true, h: 3 }),
		],
		[row({ tid: 4, gp: 12 }), row({ tid: 0, gp: 0, h: 0 })],
		[row({ season: 2025, gp: 2 }), row({ season: 2027, gp: 7 })],
		[
			row({
				tid: undefined,
				h: Number.NaN,
				bb: undefined,
				gpF: [3, , undefined],
				po: [1, , 4],
				hasTot: true,
			}),
		],
		[null, row({ playoffs: undefined, gp: 3 }), null],
		[row({ playoffs: 1, gp: 3 }), row({ playoffs: false, gp: 4 })],
		[
			row({ playoffs: true, tid: 3, gp: 12 }),
			row({ playoffs: true, tid: 0, gp: 0 }),
		],
		[row({ season: 2026, gp: 3 }), row({ season: 2025, gp: 2 })],
	];
	const players = fixtures.map((stats, i) => ({
		...structuredClone(template),
		pid: i + 1,
		stats,
	})) as Player[];
	players.push({
		...structuredClone(players[0]!),
		pid: 90,
		ratings: [] as any,
	});
	for (const playoffs of [false, true]) {
		const expected = await idb.getCopies.playersPlus(players, {
			attrs: ["pid", "tid"],
			stats: playerStatsForWAR,
			season: 2026,
			playoffs,
			regularSeason: !playoffs,
		});
		const actual = await getPlayersForWAR(players, 2026, playoffs);
		assert.deepEqual(actual, expected);
		assert.deepEqual(
			actual.filter((p) => statsRowIsCurrent(p.stats, p.tid, playoffs)),
			expected.filter((p) => statsRowIsCurrent(p.stats, p.tid, playoffs)),
		);
		for (const p of actual) {
			const raw = players.find((raw) => raw.pid === p.pid)!;
			const last = raw.stats.findLast(
				(ps) =>
					ps && ps.season === 2026 && (playoffs ? ps.playoffs : !ps.playoffs),
			);
			if (Array.isArray(p.stats.gpF)) {
				assert.notStrictEqual(p.stats.gpF, last?.gpF);
			}
		}
	}
});

test("WAR projection snapshots nested arrays before yielding to its caller", async () => {
	resetG();
	g.setWithoutSavingToDB("season", 2026);
	const p = { ...player.generate(0, 25, 2020, true, DEFAULT_LEVEL), pid: 4 };
	player.addStatsRow(p, 2026, false);
	const ps = p.stats.at(-1)!;
	ps.gpF = [3, , 1];
	ps.po = [1, , 2];
	const originalPromise = idb.getCopies.playersPlus([p], {
		attrs: ["pid", "tid"],
		stats: playerStatsForWAR,
		season: 2026,
	});
	const promise = getPlayersForWAR([p], 2026, false);
	ps.gpF[0] = 99;
	ps.po[2] = 99;
	const output = await promise;
	assert.deepEqual(output, await originalPromise);
	assert.deepEqual(output[0]!.stats.gpF, [3, , 1]);
	assert.deepEqual(output[0]!.stats.po, [1, , 2]);
	output[0]!.stats.gpF[0] = 20;
	assert.strictEqual(ps.gpF[0], 99);
});
