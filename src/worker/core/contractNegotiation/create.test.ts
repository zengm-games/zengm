import { afterEach, assert, beforeAll, test } from "vitest";
import { contractNegotiation } from "../index.ts";
import { idb } from "../../db/index.ts";
import { beforeTests, givePlayerMinContract } from "./testHelpers.ts";

beforeAll(beforeTests);
afterEach(() => idb.cache.negotiations.clear());

test("start a negotiation with a free agent", async () => {
	const pid = 0;
	await givePlayerMinContract(pid);
	const info = await contractNegotiation.create(pid, false);
	if (typeof info === "string") {
		throw new Error("Should never happen");
	} else {
		assert.strictEqual(info.pid, pid);
	}
});

test("fail to start a negotiation with anyone but a free agent", async () => {
	const pid = 2;
	await givePlayerMinContract(pid);
	const info = await contractNegotiation.create(pid, false);
	if (typeof info === "string") {
		assert(info.includes("is not a free agent."));
	} else {
		throw new Error("Should never happen");
	}
});
