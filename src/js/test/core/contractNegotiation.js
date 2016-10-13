import assert from 'assert';
import * as db from '../../db';
import g from '../../globals';
import * as contractNegotiation from '../../core/contractNegotiation';
import * as league from '../../core/league';

// Make player ask for a min contract, to ensure he'll never refuse to sign
const givePlayerMinContract = async (tx, pid) => {
    const p = await tx.players.get(pid);
    p.contract.amount = g.minContract;
    await tx.players.put(p);
};

describe("core/contractNegotiation", () => {
    before(async () => {
        await db.connectMeta();
        await league.create("Test", 14, undefined, 2013, false);
    });
    after(() => league.remove(g.lid));
    afterEach(() => {
        // Set to a trade with team 1 and no players;
        return g.dbl.tx(['gameAttributes', 'messages', 'negotiations'], 'readwrite', tx => contractNegotiation.cancelAll(tx));
    });

    describe("#create()", () => {
        it("should start a negotiation with a free agent", () => {
            return g.dbl.tx(["gameAttributes", "messages", "negotiations", "players"], "readwrite", async tx => {
                const pid = 7;

                await givePlayerMinContract(tx, pid);

                const error = await contractNegotiation.create(tx, pid, false);
                assert.equal((typeof error), "undefined", `Unexpected error message from contractNegotiation.create: "${error}"`);

                const negotiations = await tx.negotiations.getAll();
                assert.equal(negotiations.length, 1);
                assert.equal(negotiations[0].pid, pid);
            });
        });
        it("should fail to start a negotiation with anyone but a free agent", () => {
            return g.dbl.tx(["gameAttributes", "messages", "negotiations", "players"], "readwrite", async tx => {
                const pid = 70;

                await givePlayerMinContract(tx, pid);

                const error = await contractNegotiation.create(tx, pid, false);
                assert(error.includes("is not a free agent."));

                const negotiations = await tx.negotiations.getAll();
                assert.equal(negotiations.length, 0);
            });
        });
        it("should only allow one concurrent negotiation if resigning is false", () => {
            return g.dbl.tx(["gameAttributes", "messages", "negotiations", "players"], "readwrite", async tx => {
                const pid1 = 7;
                const pid2 = 8;

                await givePlayerMinContract(tx, pid1);
                await givePlayerMinContract(tx, pid2);

                let error = await contractNegotiation.create(tx, pid1, false);
                assert.equal((typeof error), "undefined", `Unexpected error message from contractNegotiation.create: "${error}"`);

                let negotiations = await tx.negotiations.getAll();
                assert.equal(negotiations.length, 1);
                assert.equal(negotiations[0].pid, pid1);

                error = await contractNegotiation.create(tx, pid2, false);
                assert.equal(error, "You cannot initiate a new negotiaion while game simulation is in progress or a previous contract negotiation is in process.");

                negotiations = await tx.negotiations.getAll();
                assert.equal(negotiations.length, 1);
                assert.equal(negotiations[0].pid, pid1);
            });
        });
        it("should allow multiple concurrent negotiations if resigning is true", () => {
            return g.dbl.tx(["gameAttributes", "messages", "negotiations", "players"], "readwrite", async tx => {
                const pid1 = 7;
                const pid2 = 8;

                await givePlayerMinContract(tx, pid1);
                await givePlayerMinContract(tx, pid2);

                let error = await contractNegotiation.create(tx, pid1, true);
                assert.equal((typeof error), "undefined", `Unexpected error message from contractNegotiation.create: "${error}"`);

                let negotiations = await tx.negotiations.getAll();
                assert.equal(negotiations.length, 1);
                assert.equal(negotiations[0].pid, pid1);

                error = await contractNegotiation.create(tx, pid2, true);
                assert.equal((typeof error), "undefined", `Unexpected error message from contractNegotiation.create: "${error}"`);

                negotiations = await tx.negotiations.getAll();
                assert.equal(negotiations.length, 2);
                assert.equal(negotiations[0].pid, pid1);
                assert.equal(negotiations[1].pid, pid2);
            });
        });
        // The use of txs here might cause race conditions
        it("should not allow a negotiation to start if there are already 15 players on the user's roster, unless resigning is true", () => {
            return g.dbl.tx(["gameAttributes", "messages", "negotiations", "players"], "readwrite", async tx => {
                const pid1 = 7;
                const pid2 = 8;

                await givePlayerMinContract(tx, pid1);
                await givePlayerMinContract(tx, pid2);

                let p = await tx.players.get(pid1);
                p.tid = g.userTid;
                await tx.players.put(p);

                let error = await contractNegotiation.create(tx, pid2, false);
                assert.equal(error, "Your roster is full. Before you can sign a free agent, you'll have to release or trade away one of your current players.");

                let negotiations = await tx.negotiations.getAll();
                assert.equal(negotiations.length, 0);

                error = await contractNegotiation.create(tx, pid2, true);
                assert.equal((typeof error), "undefined", `Unexpected error message from contractNegotiation.create: "${error}"`);

                negotiations = await tx.negotiations.getAll();
                assert.equal(negotiations.length, 1);
                assert.equal(negotiations[0].pid, pid2);

                p = await tx.players.get(pid1);
                p.tid = g.PLAYER.FREE_AGENT;
                await tx.players.put(p);
            });
        });
    });

    describe("#accept()", () => {
        it("should not allow signing non-minimum contracts that cause team to exceed the salary cap", async () => {
            await g.dbl.tx(["gameAttributes", "messages", "negotiations", "players"], "readwrite", async tx => {
                const pid = 8;

                await givePlayerMinContract(tx, pid);

                const error = await contractNegotiation.create(tx, pid, false);
                assert.equal((typeof error), "undefined", `Unexpected error message from contractNegotiation.create: "${error}"`);

                // Force a non-minimum contract that will always go over the salary cap
                const negotiation = await tx.negotiations.get(pid);
                negotiation.player.amount = g.salaryCap;
                await tx.negotiations.put(negotiation);
            });

            const error = await contractNegotiation.accept(8, g.salaryCap, 2017);
            assert.equal(error, "This contract would put you over the salary cap. You cannot go over the salary cap to sign free agents to contracts higher than the minimum salary. Either negotiate for a lower contract or cancel the negotiation.");
        });
    });
});
