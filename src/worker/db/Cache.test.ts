import {
	afterEach,
	assert,
	beforeAll,
	beforeEach,
	describe,
	test,
} from "vitest";
import { resetCache, resetG } from "../../test/helpers.ts";
import { player } from "../core/index.ts";
import { g } from "../util/index.ts";
import { idb } from "./index.ts";
import { DEFAULT_LEVEL } from "../../common/budgetLevels.ts";

describe("get", () => {
	beforeAll(async () => {
		resetG();

		await resetCache({
			players: [
				player.generate(g.get("userTid"), 30, 2017, true, DEFAULT_LEVEL),
			],
		});
	});
	beforeEach(() => {
		idb.cache._status = "full";
	});

	test("retrieve an object", async () => {
		const p = (await idb.cache.players.getAll())[0];
		assert(p);
		const p2 = await idb.cache.players.get(p.pid);
		assert(p2);
		assert.strictEqual(p.pid, p2.pid);
	});

	test("return undefined for invalid ID", async () => {
		const p = await idb.cache.players.get(-1);
		assert.strictEqual(p, undefined);
	});

	test("wait until filling complete before resolving query", async () => {
		const p = (await idb.cache.players.getAll())[0];
		assert(p);

		idb.cache._status = "filling";
		let setTimeoutCalled = false;
		setTimeout(() => {
			setTimeoutCalled = true;
			idb.cache._setStatus("full");
		}, 100);

		const p2 = await idb.cache.players.get(p.pid);
		assert(p2);
		assert(setTimeoutCalled);
		assert.strictEqual(idb.cache._status, "full");
		assert.strictEqual(p.pid, p2.pid);
	});
});

describe("flush", () => {
	beforeEach(async () => {
		await resetCache({}, { stubFlush: false });
	});

	afterEach(() => {
		// @ts-expect-error
		idb.league = undefined;
	});

	const mockLeague = ({
		failPut,
		failTransaction,
	}: {
		failPut?: boolean;
		failTransaction?: boolean;
	}) => {
		const { promise, resolve, reject } = Promise.withResolvers<void>();

		const info = {
			aborted: false,
			deletes: [] as number[],
			puts: [] as any[],

			// Allow us to reject the transaction done promise whenever we want, otherwise if !failTransaction just resolve immediately
			rejectDone: reject,
		};

		if (!failTransaction) {
			resolve();
		}

		idb.league = {
			transaction: () => ({
				abort: () => {
					info.aborted = true;
				},
				done: promise,
				objectStore: () => ({
					delete: (id: number) => {
						info.deletes.push(id);
					},
					put: (record: any) => {
						if (failPut) {
							throw new Error("Put failed");
						}
						info.puts.push(record);
					},
				}),
			}),
		} as any;

		return info;
	};

	const getError = (promise: Promise<unknown>) =>
		promise.then(
			() => undefined,
			(error: Error) => error,
		);

	test("restore pending writes if the transaction fails", async () => {
		await idb.cache.messages.delete(1);
		await idb.cache.messages.put({ mid: 2 } as any);

		const info = mockLeague({ failTransaction: true });
		const errorPromise = getError(idb.cache.flush());
		info.rejectDone(new Error("Transaction failed"));
		const error = await errorPromise;
		assert.strictEqual(error?.message, "Transaction failed");

		assert(idb.cache._dirty);
		assert.deepStrictEqual([...idb.cache._deletes.messages], [1]);
		assert.deepStrictEqual([...idb.cache._dirtyRecords.messages], [2]);

		// Retry succeeds
		const info2 = mockLeague({});
		await idb.cache.flush();
		assert.deepStrictEqual(info2.deletes, [1]);
		assert.deepStrictEqual(
			info2.puts.map((record) => record.mid),
			[2],
		);
		assert(!idb.cache._dirty);
		assert.strictEqual(idb.cache._deletes.messages.size, 0);
		assert.strictEqual(idb.cache._dirtyRecords.messages.size, 0);
	});

	test("keep writes that happen while a failing transaction is pending", async () => {
		await idb.cache.messages.put({ mid: 1 } as any);

		const info = mockLeague({ failTransaction: true });
		const errorPromise = getError(idb.cache.flush());

		// While the transaction is pending, delete the record being saved and add a new one
		await idb.cache.messages.delete(1);
		await idb.cache.messages.put({ mid: 2 } as any);

		info.rejectDone(new Error("Transaction failed"));
		await errorPromise;

		assert.deepStrictEqual([...idb.cache._deletes.messages], [1]);
		assert.deepStrictEqual(
			[...idb.cache._dirtyRecords.messages].sort(),
			[1, 2],
		);

		// Retry deletes 1, and skips putting it because it's no longer in the cache
		const info2 = mockLeague({});
		await idb.cache.flush();
		assert.deepStrictEqual(info2.deletes, [1]);
		assert.deepStrictEqual(
			info2.puts.map((record) => record.mid),
			[2],
		);
	});

	test("abort transaction and restore pending writes if a put throws", async () => {
		await idb.cache.messages.delete(1);
		await idb.cache.messages.put({ mid: 2 } as any);

		const info = mockLeague({ failPut: true });
		const error = await getError(idb.cache.flush());
		assert.strictEqual(error?.message, "Put failed");
		assert(info.aborted);

		assert(idb.cache._dirty);
		assert.deepStrictEqual([...idb.cache._deletes.messages], [1]);
		assert.deepStrictEqual([...idb.cache._dirtyRecords.messages], [2]);
	});
});
