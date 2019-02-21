// @flow

import assert from "assert";
import { contractNegotiation } from "..";
import { idb } from "../../db";
import { g } from "../../util";
import { beforeTests, givePlayerMinContract } from "./common.test";

describe("worker/core/contractNegotiation/accept", () => {
    before(beforeTests);

    afterEach(() => idb.cache.negotiations.clear());

    it("no signing non-minimum contracts that cause team to exceed the salary cap", async () => {
        const pid = 1;

        await givePlayerMinContract(pid);

        const error = await contractNegotiation.create(pid, false);
        assert.equal(
            typeof error,
            "undefined",
            `Unexpected error message from contractNegotiation.create: "${error}"`,
        );

        const error2 = await contractNegotiation.accept(
            pid,
            g.salaryCap,
            g.season + 1,
        );
        assert.equal(
            error2,
            "This contract would put you over the salary cap. You cannot go over the salary cap to sign free agents to contracts higher than the minimum salary.",
        );
    });
});
