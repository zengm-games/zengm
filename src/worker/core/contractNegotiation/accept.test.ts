import assert from "assert";
import { contractNegotiation } from "..";
import { idb } from "../../db";
import { g } from "../../util";
import { beforeTests, givePlayerMinContract } from "./testHelpers";

describe("worker/core/contractNegotiation/accept", () => {
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
		const error2 = await contractNegotiation.accept(
			pid,
			g.get("salaryCap"),
			g.get("season") + 1,
		);
		assert.strictEqual(
			error2,
			"This contract would put you over the salary cap. You cannot go over the salary cap to sign free agents to contracts higher than the minimum salary.",
		);
	});
});
