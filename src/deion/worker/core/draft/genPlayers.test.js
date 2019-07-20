// @flow

import assert from "assert";
import { PLAYER } from "../../../common";
import testHelpers from "../../../test/helpers";
import { idb } from "../../db";
import { g } from "../../util";
import { draft } from "..";

describe("worker/core/draft/genPlayers", () => {
    it("generate 70 players for the draft", async () => {
        testHelpers.resetG();
        await testHelpers.resetCache();
        idb.league = testHelpers.mockIDBLeague();

        await draft.genPlayers(g.season, 15.5);

        const players = await idb.cache.players.indexGetAll(
            "playersByDraftYearRetiredYear",
            [[g.season], [g.season, Infinity]],
        );

        assert.equal(players.length, 70); // 70 players in a draft class
        for (const p of players) {
            assert.equal(p.tid, PLAYER.UNDRAFTED);
        }

        idb.league = undefined;
    });
});
