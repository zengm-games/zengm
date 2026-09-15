import { assert, test } from "vitest";
import { Cache, idb } from "./index.ts";
import { resetCache } from "../../test/helpers.ts";
import { local } from "../util/index.ts";

test("flush preserves writes and deletes and waits for transaction completion", async () => {
	const previousLeague = idb.league;
	const previousAutoSave = local.autoSave;
	await resetCache();
	const operations: unknown[] = [];
	let finish!: () => void;
	const done = new Promise<void>((resolve) => {
		finish = resolve;
	});
	idb.league = {
		transaction(stores: string[], mode: string) {
			operations.push([stores, mode]);
			return {
				done,
				objectStore(store: string) {
					return {
						delete(id: number) {
							operations.push([store, "delete", id]);
						},
						put(record: unknown) {
							operations.push([store, "put", record]);
						},
					};
				},
			};
		},
	} as unknown as typeof idb.league;
	local.autoSave = true;
	try {
		const record = { gid: 42 };
		idb.cache._data.games[42] = record;
		idb.cache._dirtyRecords.games.add(42);
		idb.cache._dirtyRecords.games.add(43); // Deleted after being marked dirty.
		idb.cache._deletes.games.add(43);
		idb.cache._dirty = false; // Skip unrelated league metadata updates.
		let completed = false;
		const pending = Cache.prototype.flush
			.call(idb.cache, ["games"])
			.then(() => {
				completed = true;
			});
		await Promise.resolve();
		assert.isFalse(completed);
		assert.deepEqual(operations, [
			[["games"], "readwrite"],
			["games", "delete", 43],
			["games", "put", record],
		]);
		finish();
		await pending;
		assert.isTrue(completed);
		assert.strictEqual(idb.cache._dirtyRecords.games.size, 0);
		assert.strictEqual(idb.cache._deletes.games.size, 0);
	} finally {
		finish();
		idb.league = previousLeague;
		local.autoSave = previousAutoSave;
		await resetCache();
	}
});
