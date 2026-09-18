import { assert, test } from "vitest";
import Cache from "./Cache.ts";

test("index queries reflect puts, deletes and clearing after a live bucket was sorted", async () => {
	const cache = new Cache();
	cache._status = "full";
	cache._dirtyRecords.players = new Set();
	cache._deletes.players = new Set();
	const first = {
		pid: 2,
		tid: 3,
		draft: { year: 2020 },
		retiredYear: Infinity,
	};
	const second = {
		pid: 9,
		tid: 3,
		draft: { year: 2020 },
		retiredYear: Infinity,
	};
	cache._data.players = { 9: second, 2: first };
	cache._refreshIndexes("players");
	const bucket = await cache.players.indexGetAll("playersByTid", 3);
	assert.deepEqual(bucket, [first, second]);
	bucket.reverse();
	second.tid = 4;
	first.draft.year = 2021;
	first.retiredYear = 2026;
	await cache.players.put(second as any);
	await cache.players.put(first as any);
	assert.deepEqual(await cache.players.indexGetAll("playersByTid", 3), [first]);
	assert.deepEqual(await cache.players.indexGetAll("playersByTid", 4), [
		second,
	]);
	assert.strictEqual(cache._dirtyIndexes.has("players"), false);
	assert.strictEqual(await cache.players.indexGet("playersByTid", 3), first);
	assert.strictEqual(
		await cache.players.indexGet("playersByDraftYearRetiredYear", [
			2020,
			Infinity,
		]),
		second,
	);
	assert.strictEqual(
		await cache.players.indexGet("playersByDraftYearRetiredYear", [2021, 2026]),
		first,
	);
	assert.deepEqual(
		await cache.players.indexGetAll("playersByDraftYearRetiredYear", [
			[2020, Infinity],
			[2020, Infinity],
		]),
		[second],
	);
	await cache.players.delete(9);
	assert.deepEqual(await cache.players.indexGetAll("playersByTid", 4), []);
	assert.strictEqual(
		await cache.players.indexGet("playersByDraftYearRetiredYear", [
			2020,
			Infinity,
		]),
		undefined,
	);
	await cache.players.clear();
	assert.deepEqual(
		await cache.players.indexGetAll("playersByTid", [-Infinity, Infinity]),
		[],
	);
	assert.strictEqual(
		await cache.players.indexGet("playersByDraftYearRetiredYear", [2021, 2026]),
		undefined,
	);
});

test("rebuilding unique compound indexes replaces old keys and retains live objects", () => {
	const cache = new Cache();
	const row = { rid: 1, season: 2026, tid: 4 };
	cache._data.teamSeasons = { 1: row };
	cache._refreshIndexes("teamSeasons");
	const oldKeys = [
		Object.keys(cache._indexes.teamSeasonsBySeasonTid)[0]!,
		Object.keys(cache._indexes.teamSeasonsByTidSeason)[0]!,
	];
	row.season = 2027;
	row.tid = 5;
	cache._refreshIndexes("teamSeasons");
	assert.strictEqual(
		cache._indexes.teamSeasonsBySeasonTid[oldKeys[0]!],
		undefined,
	);
	assert.strictEqual(
		cache._indexes.teamSeasonsByTidSeason[oldKeys[1]!],
		undefined,
	);
	for (const index of [
		cache._indexes.teamSeasonsBySeasonTid,
		cache._indexes.teamSeasonsByTidSeason,
	]) {
		assert.strictEqual(Object.values(index).length, 1);
		assert.strictEqual(Object.values(index)[0], row);
	}
});
