import assert from 'assert';
import {Cache, connectMeta, idb} from '../../db';
import {PLAYER, g} from '../../common';
import {contractNegotiation, league} from '../../core';

// Make player ask for a min contract, to ensure he'll never refuse to sign
const givePlayerMinContract = async (pid) => {
    const p = await idb.cache.players.get(pid);
    p.contract.amount = g.minContract;
    await idb.cache.put('players', p);
};

describe("core/contractNegotiation", () => {
    before(async () => {
        idb.meta = await connectMeta();
        await league.create("Test", 14, undefined, 2013, false);
        idb.cache = new Cache();
        await idb.cache.fill();
    });
    after(() => league.remove(g.lid));
    afterEach(() => contractNegotiation.cancelAll());

    describe("#create()", () => {
        it("should start a negotiation with a free agent", async () => {
            const pid = 7;

            await givePlayerMinContract(pid);

            const error = await contractNegotiation.create(pid, false);
            assert.equal((typeof error), "undefined", `Unexpected error message from contractNegotiation.create: "${error}"`);

            const negotiations = await idb.cache.getAll('negotiations');
            assert.equal(negotiations.length, 1);
            assert.equal(negotiations[0].pid, pid);
        });
        it("should fail to start a negotiation with anyone but a free agent", async () => {
            const pid = 70;

            await givePlayerMinContract(pid);

            const error = await contractNegotiation.create(pid, false);
            assert(error.includes("is not a free agent."));

            const negotiations = await idb.cache.getAll('negotiations');
            assert.equal(negotiations.length, 0);
        });
        it("should only allow one concurrent negotiation if resigning is false", async () => {
            const pid1 = 7;
            const pid2 = 8;

            await givePlayerMinContract(pid1);
            await givePlayerMinContract(pid2);

            let error = await contractNegotiation.create(pid1, false);
            assert.equal((typeof error), "undefined", `Unexpected error message from contractNegotiation.create: "${error}"`);

            let negotiations = await idb.cache.getAll('negotiations');
            assert.equal(negotiations.length, 1);
            assert.equal(negotiations[0].pid, pid1);

            error = await contractNegotiation.create(pid2, false);
            assert.equal(error, "You cannot initiate a new negotiaion while game simulation is in progress or a previous contract negotiation is in process.");

            negotiations = await idb.cache.getAll('negotiations');
            assert.equal(negotiations.length, 1);
            assert.equal(negotiations[0].pid, pid1);
        });
        it("should allow multiple concurrent negotiations if resigning is true", async () => {
            const pid1 = 7;
            const pid2 = 8;

            await givePlayerMinContract(pid1);
            await givePlayerMinContract(pid2);

            let error = await contractNegotiation.create(pid1, true);
            assert.equal((typeof error), "undefined", `Unexpected error message from contractNegotiation.create: "${error}"`);

            let negotiations = await idb.cache.getAll('negotiations');
            assert.equal(negotiations.length, 1);
            assert.equal(negotiations[0].pid, pid1);

            error = await contractNegotiation.create(pid2, true);
            assert.equal((typeof error), "undefined", `Unexpected error message from contractNegotiation.create: "${error}"`);

            negotiations = await idb.cache.getAll('negotiations');
            assert.equal(negotiations.length, 2);
            assert.equal(negotiations[0].pid, pid1);
            assert.equal(negotiations[1].pid, pid2);
        });
        // The use of txs here might cause race conditions
        it("should not allow a negotiation to start if there are already 15 players on the user's roster, unless resigning is true", async () => {
            const pid1 = 7;
            const pid2 = 8;

            await givePlayerMinContract(pid1);
            await givePlayerMinContract(pid2);

            const p = await idb.cache.players.get(pid1);
            p.tid = g.userTid;
            await idb.cache.put('players', p);
            idb.cache.markDirtyIndexes('players');

            let error = await contractNegotiation.create(pid2, false);
            assert.equal(error, "Your roster is full. Before you can sign a free agent, you'll have to release or trade away one of your current players.");

            let negotiations = await idb.cache.getAll('negotiations');
            assert.equal(negotiations.length, 0);

            error = await contractNegotiation.create(pid2, true);
            assert.equal((typeof error), "undefined", `Unexpected error message from contractNegotiation.create: "${error}"`);

            negotiations = await idb.cache.getAll('negotiations');
            assert.equal(negotiations.length, 1);
            assert.equal(negotiations[0].pid, pid2);

            p.tid = PLAYER.FREE_AGENT;
            await idb.cache.put('players', p);
            idb.cache.markDirtyIndexes('players');
        });
    });

    describe("#accept()", () => {
        it("should not allow signing non-minimum contracts that cause team to exceed the salary cap", async () => {
            const pid = 8;

            await givePlayerMinContract(pid);

            const error = await contractNegotiation.create(pid, false);
            assert.equal((typeof error), "undefined", `Unexpected error message from contractNegotiation.create: "${error}"`);

            // Force a non-minimum contract that will always go over the salary cap
            const negotiation = await idb.cache.get('negotiations', pid);
            negotiation.player.amount = g.salaryCap;
            await idb.cache.put('negotiations', negotiation);

            const error2 = await contractNegotiation.accept(8, g.salaryCap, 2017);
            assert.equal(error2, "This contract would put you over the salary cap. You cannot go over the salary cap to sign free agents to contracts higher than the minimum salary. Either negotiate for a lower contract or cancel the negotiation.");
        });
    });
});
