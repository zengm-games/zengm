// @flow

import assert from "assert";
import { describe, it } from "mocha";
import { PLAYER } from "../../../common";
import testHelpers from "../../../test/helpers";
import { idb } from "../../db";
import { draft } from "..";

describe("worker/core/draft/genPlayers", () => {
    it("generate 70 players for the draft", async () => {
        testHelpers.resetG();
        await testHelpers.resetCache();

        await draft.genPlayers(PLAYER.UNDRAFTED, 15.5);
        const players = await idb.cache.players.indexGetAll(
            "playersByTid",
            PLAYER.UNDRAFTED,
        );
        assert.equal(players.length, 70); // 70 players in a draft class
    });
});
