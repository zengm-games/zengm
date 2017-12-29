import assert from "assert";
import { g } from "../../../common";
import helpers from "../../helpers";
import { player, trade } from "../../../worker/core";
import { idb } from "../../../worker/db";

describe("core/trade", () => {
    before(async () => {
        helpers.resetG();

        g.numTeams = 3;

        await helpers.resetCache({
            players: [
                // Two players per team
                player.generate(0, 30, 50, 2017, true, 15.5),
                player.generate(0, 30, 50, 2017, true, 15.5),
                player.generate(1, 30, 50, 2017, true, 15.5),
                player.generate(1, 30, 50, 2017, true, 15.5),
                player.generate(2, 30, 50, 2017, true, 15.5),
                player.generate(2, 30, 50, 2017, true, 15.5),
            ],

            trade: [
                {
                    rid: 0,
                    teams: [
                        {
                            tid: 0,
                            pids: [],
                            dpids: [],
                        },
                        {
                            tid: 1,
                            pids: [],
                            dpids: [],
                        },
                    ],
                },
            ],
        });
    });
    afterEach(async () => {
        // Set to a trade with team 1 and no players;
        await trade.create([
            { tid: g.userTid, pids: [], dpids: [] },
            { tid: 1, pids: [], dpids: [] },
        ]);
        await trade.clear();
    });

    const testCreateTrade = async (
        otherTidTest,
        userPidsTest,
        otherPidsTest,
    ) => {
        const { teams } = await idb.cache.trade.get(0);
        assert.deepEqual(teams[1].tid, otherTidTest);
        assert.deepEqual(teams[0].pids, userPidsTest);
        assert.deepEqual(teams[1].pids, otherPidsTest);
    };

    describe("#create()", () => {
        it("should create trade with team ID", async () => {
            await trade.create([
                { tid: g.userTid, pids: [], dpids: [] },
                { tid: 1, pids: [], dpids: [] },
            ]);
            await testCreateTrade(1, [], []);
        });
        it("should create trade with player ID", async () => {
            await trade.create([
                { tid: g.userTid, pids: [], dpids: [] },
                { tid: 2, pids: [2], dpids: [] },
            ]);
            await testCreateTrade(2, [], [2]);
        });
    });

    describe("#updatePlayers()", () => {
        it("should allow players from both teams to be set", async () => {
            await trade.create([
                { tid: g.userTid, pids: [], dpids: [] },
                { tid: 1, pids: [], dpids: [] },
            ]);
            const userPidsTest = [0, 1];
            const otherPidsTest = [2, 3];
            const teams = await trade.updatePlayers([
                { tid: g.userTid, pids: userPidsTest, dpids: [] },
                { tid: 1, pids: otherPidsTest, dpids: [] },
            ]);
            assert.deepEqual(teams[0].pids, userPidsTest);
            assert.deepEqual(teams[1].pids, otherPidsTest);
        });
        it("should filter out invalid players", async () => {
            await trade.create([
                { tid: g.userTid, pids: [], dpids: [] },
                { tid: 1, pids: [], dpids: [] },
            ]);
            const teams = await trade.updatePlayers([
                { tid: g.userTid, pids: [1, 16, 20, 48, 50, 90], dpids: [] },
                { tid: 1, pids: [12, 63, 3, 87, 97, 524], dpids: [] },
            ]);
            assert.deepEqual(teams[0].pids, [1]);
            assert.deepEqual(teams[1].pids, [3]);
        });
        it("should delete the other team's players, but not the user's players, from the trade when a new team is selected", async () => {
            await trade.create([
                { tid: g.userTid, pids: [], dpids: [] },
                { tid: 1, pids: [], dpids: [] },
            ]);
            const userPidsTest = [0, 1];
            const otherPidsTest = [2, 3];
            let teams = await trade.updatePlayers([
                { tid: g.userTid, pids: userPidsTest, dpids: [] },
                { tid: 1, pids: otherPidsTest, dpids: [] },
            ]);
            assert.deepEqual(teams[0].pids, userPidsTest);
            assert.deepEqual(teams[1].pids, otherPidsTest);

            await trade.create([
                { tid: g.userTid, pids: [], dpids: [] },
                { tid: 2, pids: [], dpids: [] },
            ]);
            const tr = await idb.cache.trade.get(0);
            teams = tr.teams;
            assert.deepEqual(teams[0].pids, userPidsTest);
            assert.deepEqual(teams[1].pids, []);
        });
    });
});
