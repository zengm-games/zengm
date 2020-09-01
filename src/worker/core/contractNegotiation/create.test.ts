import assert from "assert";
import { PLAYER } from "../../../common";
import { contractNegotiation } from "..";
import { idb } from "../../db";
import { g } from "../../util";
import { beforeTests, givePlayerMinContract } from "./testHelpers";
import type { Player } from "../../../common/types";

describe("worker/core/contractNegotiation/create", () => {
	beforeAll(beforeTests);
	afterEach(() => idb.cache.negotiations.clear());

	test("start a negotiation with a free agent", async () => {
		const pid = 0;
		await givePlayerMinContract(pid);
		const error = await contractNegotiation.create(pid, false);
		assert.strictEqual(
			typeof error,
			"undefined",
			`Unexpected error message from contractNegotiation.create: "${error}"`,
		);
		const negotiations = await idb.cache.negotiations.getAll();
		assert.strictEqual(negotiations.length, 1);
		assert.strictEqual(negotiations[0].pid, pid);
	});

	test("fail to start a negotiation with anyone but a free agent", async () => {
		const pid = 2;
		await givePlayerMinContract(pid);
		const error = await contractNegotiation.create(pid, false);
		assert(error);
		if (error) {
			assert(error.includes("is not a free agent."));
		}
		const negotiations = await idb.cache.negotiations.getAll();
		assert.strictEqual(negotiations.length, 0);
	});

	test("only allow one concurrent negotiation if resigning is false", async () => {
		const pid1 = 0;
		const pid2 = 1;
		await givePlayerMinContract(pid1);
		await givePlayerMinContract(pid2);
		let error = await contractNegotiation.create(pid1, false);
		assert.strictEqual(
			typeof error,
			"undefined",
			`Unexpected error message from contractNegotiation.create: "${error}"`,
		);
		let negotiations = await idb.cache.negotiations.getAll();
		assert.strictEqual(negotiations.length, 1);
		assert.strictEqual(negotiations[0].pid, pid1);
		error = await contractNegotiation.create(pid2, false);
		assert.strictEqual(
			typeof error,
			"undefined",
			`Unexpected error message from contractNegotiation.create: "${error}"`,
		);
		negotiations = await idb.cache.negotiations.getAll();
		assert.strictEqual(negotiations.length, 1);
		assert.strictEqual(negotiations[0].pid, pid2);
	});

	test("allow multiple concurrent negotiations if resigning is true", async () => {
		const pid1 = 0;
		const pid2 = 1;
		await givePlayerMinContract(pid1);
		await givePlayerMinContract(pid2);
		let error = await contractNegotiation.create(pid1, true);
		assert.strictEqual(
			typeof error,
			"undefined",
			`Unexpected error message from contractNegotiation.create: "${error}"`,
		);
		let negotiations = await idb.cache.negotiations.getAll();
		assert.strictEqual(negotiations.length, 1);
		assert.strictEqual(negotiations[0].pid, pid1);
		error = await contractNegotiation.create(pid2, true);
		assert.strictEqual(
			typeof error,
			"undefined",
			`Unexpected error message from contractNegotiation.create: "${error}"`,
		);
		negotiations = await idb.cache.negotiations.getAll();
		assert.strictEqual(negotiations.length, 2);
		assert.strictEqual(negotiations[0].pid, pid1);
		assert.strictEqual(negotiations[1].pid, pid2);
	});

	// The use of txs here might cause race conditions
	test("don't start negotiation if there are already 15 players on the user's roster, unless resigning is true", async () => {
		const pid1 = 0;
		const pid2 = 1;
		await givePlayerMinContract(pid1);
		await givePlayerMinContract(pid2);
		const p = (await idb.cache.players.get(pid1)) as Player;
		p.tid = g.get("userTid");
		await idb.cache.players.put(p);
		let error = await contractNegotiation.create(pid2, false);
		assert.strictEqual(
			error,
			"Your roster is full. Before you can sign a free agent, you'll have to release or trade away one of your current players.",
		);
		let negotiations = await idb.cache.negotiations.getAll();
		assert.strictEqual(negotiations.length, 0);
		error = await contractNegotiation.create(pid2, true);
		assert.strictEqual(
			typeof error,
			"undefined",
			`Unexpected error message from contractNegotiation.create: "${error}"`,
		);
		negotiations = await idb.cache.negotiations.getAll();
		assert.strictEqual(negotiations.length, 1);
		assert.strictEqual(negotiations[0].pid, pid2);
		p.tid = PLAYER.FREE_AGENT;
		await idb.cache.players.put(p);
	});
});
