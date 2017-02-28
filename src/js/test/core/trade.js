import assert from 'assert';
import {connectMeta, idb} from '../../../db';
import g from '../../globals';
import * as league from '../../core/league';
import * as trade from '../../core/trade';

describe("core/trade", () => {
    before(async () => {
        await connectMeta();
        await league.create("Test", 0, undefined, 2013, false);
    });
    after(() => league.remove(g.lid));
    afterEach(async () => {
        // Set to a trade with team 1 and no players;
        await trade.create([{tid: g.userTid, pids: [], dpids: []}, {tid: 1, pids: [], dpids: []}]);
        await trade.clear();
    });

    const testCreateTrade = async (otherTidTest, userPidsTest, otherPidsTest) => {
        const {teams} = await idb.cache.get('trade', 0);
        assert.deepEqual(teams[1].tid, otherTidTest);
        assert.deepEqual(teams[0].pids, userPidsTest);
        assert.deepEqual(teams[1].pids, otherPidsTest);
    };

    describe("#create()", () => {
        it("should create trade with team ID", async () => {
            await trade.create([{tid: g.userTid, pids: [], dpids: []}, {tid: 22, pids: [], dpids: []}]);
            await testCreateTrade(22, [], []);
        });
        it("should create trade with player ID", async () => {
            await trade.create([{tid: g.userTid, pids: [], dpids: []}, {tid: 2, pids: [81], dpids: []}]);
            await testCreateTrade(2, [], [81]);
        });
    });

    describe("#updatePlayers()", () => {
        it("should allow players from both teams to be set", async () => {
            await trade.create([{tid: g.userTid, pids: [], dpids: []}, {tid: 3, pids: [], dpids: []}]);
            const userPidsTest = [48, 50];
            const otherPidsTest = [87, 97];
            const teams = await trade.updatePlayers([{tid: g.userTid, pids: userPidsTest, dpids: []}, {tid: 3, pids: otherPidsTest, dpids: []}]);
            assert.deepEqual(teams[0].pids, userPidsTest);
            assert.deepEqual(teams[1].pids, otherPidsTest);
        });
        it("should filter out invalid players", async () => {
            await trade.create([{tid: g.userTid, pids: [], dpids: []}, {tid: 3, pids: [], dpids: []}]);
            const teams = await trade.updatePlayers([{tid: g.userTid, pids: [1, 16, 20, 48, 50, 90], dpids: []}, {tid: 3, pids: [12, 63, 70, 87, 97, 524], dpids: []}]);
            assert.deepEqual(teams[0].pids, [48, 50]);
            assert.deepEqual(teams[1].pids, [87, 97]);
        });
        it("should delete the other team's players, but not the user's players, from the trade when a new team is selected", async () => {
            await trade.create([{tid: g.userTid, pids: [], dpids: []}, {tid: 3, pids: [], dpids: []}]);
            const userPidsTest = [48, 50];
            const otherPidsTest = [87, 97];
            let teams = await trade.updatePlayers([{tid: g.userTid, pids: userPidsTest, dpids: []}, {tid: 3, pids: otherPidsTest, dpids: []}]);
            assert.deepEqual(teams[0].pids, userPidsTest);
            assert.deepEqual(teams[1].pids, otherPidsTest);

            await trade.create([{tid: g.userTid, pids: [], dpids: []}, {tid: 4, pids: [], dpids: []}]);
            const tr = await idb.cache.get('trade', 0);
            teams = tr.teams;
            assert.deepEqual(teams[0].pids, userPidsTest);
            assert.deepEqual(teams[1].pids, []);
        });
    });
});
