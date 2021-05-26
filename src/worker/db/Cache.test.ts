import assert from "assert";
import testHelpers from "../../test/helpers";
import { player } from "../core";
import { g } from "../util";
import { idb } from ".";
import type { Player } from "../../common/types";

describe("worker/db/Cache", () => {
	beforeAll(async () => {
		testHelpers.resetG();

		await testHelpers.resetCache({
			players: [player.generate(g.get("userTid"), 30, 2017, true, 15.5)],
		});
	});
	beforeEach(() => {
		idb.cache._status = "full";
	});

	describe("get", () => {
		test("retrieve an object", async () => {
			const p = (await idb.cache.players.getAll())[0];
			const p2 = (await idb.cache.players.get(p.pid)) as Player;
			assert.strictEqual(p.pid, p2.pid);
		});

		test("return undefined for invalid ID", async () => {
			const p = await idb.cache.players.get(-1);
			assert.strictEqual(typeof p, "undefined");
		});

		test("wait until filling complete before resolving query", async () => {
			const p = (await idb.cache.players.getAll())[0];

			idb.cache._status = "filling";
			let setTimeoutCalled = false;
			setTimeout(() => {
				setTimeoutCalled = true;
				idb.cache._setStatus("full");
			}, 1000);

			const p2 = (await idb.cache.players.get(p.pid)) as Player;
			assert(setTimeoutCalled);
			assert.strictEqual(idb.cache._status, "full");
			assert.strictEqual(p.pid, p2.pid);
		});
	});
});
