// @flow

import assert from "assert";
import { idb } from "../../db";
import { g } from "../../util";
import { trade } from "..";
import { beforeTests, reset } from "./common.test";

const testCreateTrade = async (otherTidTest, userPidsTest, otherPidsTest) => {
    const { teams } = await idb.cache.trade.get(0);
    assert.deepEqual(teams[1].tid, otherTidTest);
    assert.deepEqual(teams[0].pids, userPidsTest);
    assert.deepEqual(teams[1].pids, otherPidsTest);
};

describe("worker/core/trade/create", () => {
    before(beforeTests);
    afterEach(reset);

    it("create trade with team ID", async () => {
        await trade.create([
            {
                tid: g.userTid,
                pids: [],
                pidsExcluded: [],
                dpids: [],
                dpidsExcluded: [],
            },
            {
                tid: 1,
                pids: [],
                pidsExcluded: [],
                dpids: [],
                dpidsExcluded: [],
            },
        ]);
        await testCreateTrade(1, [], []);
    });

    it("create trade with player ID", async () => {
        await trade.create([
            {
                tid: g.userTid,
                pids: [],
                pidsExcluded: [],
                dpids: [],
                dpidsExcluded: [],
            },
            {
                tid: 2,
                pids: [2],
                pidsExcluded: [],
                dpids: [],
                dpidsExcluded: [],
            },
        ]);
        await testCreateTrade(2, [], [2]);
    });
});
