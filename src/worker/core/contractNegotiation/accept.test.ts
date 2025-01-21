import { afterEach, assert, beforeAll, test } from "vitest";
import { contractNegotiation } from "..";
import { idb } from "../../db";
import { g } from "../../util";
import { beforeTests, givePlayerMinContract } from "./testHelpers";

beforeAll(beforeTests);
afterEach(() => idb.cache.negotiations.clear());

test("no signing non-minimum contracts that cause team to exceed the salary cap", async () => {
	const pid = 1;
	await givePlayerMinContract(pid);
	const error = await contractNegotiation.create(pid, false);
	assert.strictEqual(
		typeof error,
		"undefined",
		`Unexpected error message from contractNegotiation.create: "${error}"`,
	);
	const error2 = await contractNegotiation.accept({
		pid,
		amount: g.get("salaryCap"),
		exp: g.get("season") + 1,
	});
	assert.strictEqual(
		error2,
		"You cannot go over the salary cap to sign free agents to contracts higher than the minimum salary.",
	);
});
