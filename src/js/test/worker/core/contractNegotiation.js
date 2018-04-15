import assert from "assert";
import { PLAYER, g } from "../../../common";
import helpers from "../../helpers";
import { contractNegotiation, player } from "../../../worker/core";
import { idb } from "../../../worker/db";

// Make player ask for a min contract, to ensure he'll never refuse to sign
const givePlayerMinContract = async pid => {
    const p = await idb.cache.players.get(pid);
    p.contract.amount = g.minContract;
    await idb.cache.players.put(p);
};

describe("core/contractNegotiation", () => {
    before(async () => {
        helpers.resetG();

        await helpers.resetCache({
            players: [
                // Free agents
                player.generate(PLAYER.FREE_AGENT, 30, 2017, true, 15.5),
                player.generate(PLAYER.FREE_AGENT, 30, 2017, true, 15.5),

                // Non free agent
                player.generate(12, 30, 2017, true, 15.5),

                // User's team - 14 players
                player.generate(g.userTid, 30, 2017, true, 15.5),
                player.generate(g.userTid, 30, 2017, true, 15.5),
                player.generate(g.userTid, 30, 2017, true, 15.5),
                player.generate(g.userTid, 30, 2017, true, 15.5),
                player.generate(g.userTid, 30, 2017, true, 15.5),
                player.generate(g.userTid, 30, 2017, true, 15.5),
                player.generate(g.userTid, 30, 2017, true, 15.5),
                player.generate(g.userTid, 30, 2017, true, 15.5),
                player.generate(g.userTid, 30, 2017, true, 15.5),
                player.generate(g.userTid, 30, 2017, true, 15.5),
                player.generate(g.userTid, 30, 2017, true, 15.5),
                player.generate(g.userTid, 30, 2017, true, 15.5),
                player.generate(g.userTid, 30, 2017, true, 15.5),
                player.generate(g.userTid, 30, 2017, true, 15.5),
            ],
        });
    });
    afterEach(() => idb.cache.negotiations.clear());

    describe("#create()", () => {
        it("should start a negotiation with a free agent", async () => {
            const pid = 0;

            await givePlayerMinContract(pid);

            const error = await contractNegotiation.create(pid, false);
            assert.equal(
                typeof error,
                "undefined",
                `Unexpected error message from contractNegotiation.create: "${error}"`,
            );

            const negotiations = await idb.cache.negotiations.getAll();
            assert.equal(negotiations.length, 1);
            assert.equal(negotiations[0].pid, pid);
        });
        it("should fail to start a negotiation with anyone but a free agent", async () => {
            const pid = 2;

            await givePlayerMinContract(pid);

            const error = await contractNegotiation.create(pid, false);
            assert(error.includes("is not a free agent."));

            const negotiations = await idb.cache.negotiations.getAll();
            assert.equal(negotiations.length, 0);
        });
        it("should only allow one concurrent negotiation if resigning is false", async () => {
            const pid1 = 0;
            const pid2 = 1;

            await givePlayerMinContract(pid1);
            await givePlayerMinContract(pid2);

            let error = await contractNegotiation.create(pid1, false);
            assert.equal(
                typeof error,
                "undefined",
                `Unexpected error message from contractNegotiation.create: "${error}"`,
            );

            let negotiations = await idb.cache.negotiations.getAll();
            assert.equal(negotiations.length, 1);
            assert.equal(negotiations[0].pid, pid1);

            error = await contractNegotiation.create(pid2, false);
            assert.equal(
                error,
                "You cannot initiate a new negotiaion while game simulation is in progress or a previous contract negotiation is in process.",
            );

            negotiations = await idb.cache.negotiations.getAll();
            assert.equal(negotiations.length, 1);
            assert.equal(negotiations[0].pid, pid1);
        });
        it("should allow multiple concurrent negotiations if resigning is true", async () => {
            const pid1 = 0;
            const pid2 = 1;

            await givePlayerMinContract(pid1);
            await givePlayerMinContract(pid2);

            let error = await contractNegotiation.create(pid1, true);
            assert.equal(
                typeof error,
                "undefined",
                `Unexpected error message from contractNegotiation.create: "${error}"`,
            );

            let negotiations = await idb.cache.negotiations.getAll();
            assert.equal(negotiations.length, 1);
            assert.equal(negotiations[0].pid, pid1);

            error = await contractNegotiation.create(pid2, true);
            assert.equal(
                typeof error,
                "undefined",
                `Unexpected error message from contractNegotiation.create: "${error}"`,
            );

            negotiations = await idb.cache.negotiations.getAll();
            assert.equal(negotiations.length, 2);
            assert.equal(negotiations[0].pid, pid1);
            assert.equal(negotiations[1].pid, pid2);
        });
        // The use of txs here might cause race conditions
        it("should not allow a negotiation to start if there are already 15 players on the user's roster, unless resigning is true", async () => {
            const pid1 = 0;
            const pid2 = 1;

            await givePlayerMinContract(pid1);
            await givePlayerMinContract(pid2);

            const p = await idb.cache.players.get(pid1);
            p.tid = g.userTid;
            await idb.cache.players.put(p);

            let error = await contractNegotiation.create(pid2, false);
            assert.equal(
                error,
                "Your roster is full. Before you can sign a free agent, you'll have to release or trade away one of your current players.",
            );

            let negotiations = await idb.cache.negotiations.getAll();
            assert.equal(negotiations.length, 0);

            error = await contractNegotiation.create(pid2, true);
            assert.equal(
                typeof error,
                "undefined",
                `Unexpected error message from contractNegotiation.create: "${error}"`,
            );

            negotiations = await idb.cache.negotiations.getAll();
            assert.equal(negotiations.length, 1);
            assert.equal(negotiations[0].pid, pid2);

            p.tid = PLAYER.FREE_AGENT;
            await idb.cache.players.put(p);
        });
    });

    describe("#accept()", () => {
        it("should not allow signing non-minimum contracts that cause team to exceed the salary cap", async () => {
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
                "This contract would put you over the salary cap. You cannot go over the salary cap to sign free agents to contracts higher than the minimum salary. Either negotiate for a lower contract or cancel the negotiation.",
            );
        });
    });
});
