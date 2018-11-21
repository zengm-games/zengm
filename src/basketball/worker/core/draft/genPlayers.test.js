// @flow

import assert from "assert";
import { describe, it } from "mocha";
import { PLAYER } from "../../../../deion/common";
import testHelpers from "../../../test/helpers";
import { idb } from "../../../../deion/worker/db";
import { draft } from "..";

describe("worker/core/draft/genPlayers", () => {
    it("generate 70 players for the draft", async () => {
        testHelpers.resetG();
        await testHelpers.resetCache();
        idb.league = testHelpers.mockIDBLeague();

        await draft.genPlayers(PLAYER.UNDRAFTED, 15.5);
        const players = await idb.cache.players.indexGetAll(
            "playersByTid",
            PLAYER.UNDRAFTED,
        );
        assert.equal(players.length, 70); // 70 players in a draft class

        idb.league = undefined;
    });
});
