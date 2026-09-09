import { assert, beforeAll, test } from "vitest";
import { DEFAULT_LEVEL } from "../../common/budgetLevels.ts";
import { resetCache, resetG } from "../../test/helpers.ts";
import { player } from "../core/index.ts";
import { idb } from "../db/index.ts";
import advStatsSave from "./advStatsSave.ts";

beforeAll(async () => {
	resetG();
	const players = [
		player.generate(0, 25, 2010, true, DEFAULT_LEVEL),
		player.generate(1, 25, 2010, true, DEFAULT_LEVEL),
	];
	for (const p of players) {
		player.addStatsRow(p, 2013, false);
	}
	await resetCache({ players });
});

test("matches calculated stats to players by PID and saves them in one batch", async () => {
	const playersRaw = await idb.cache.players.getAll();
	const [p1, p2] = playersRaw;
	assert(p1);
	assert(p2);

	await advStatsSave([{ pid: p2.pid }, { pid: p1.pid }], playersRaw, {
		per: [22, 11],
		dws: [Number.NaN, 3],
	});

	assert.strictEqual(
		(await idb.cache.players.get(p1.pid))?.stats.at(-1)?.per,
		11,
	);
	assert.strictEqual(
		(await idb.cache.players.get(p1.pid))?.stats.at(-1)?.dws,
		3,
	);
	assert.strictEqual(
		(await idb.cache.players.get(p2.pid))?.stats.at(-1)?.per,
		22,
	);
	assert.strictEqual(
		(await idb.cache.players.get(p2.pid))?.stats.at(-1)?.dws,
		0,
	);
});
