// @flow

import assert from "assert";
import { after, before, describe, it } from "mocha";
import { PLAYER, g } from "../../../common";
import testHelpers from "../../../test/helpers";
import { idb } from "../../db";
import { draft } from "..";
import { getDraftTids, loadTeamSeasons } from "./common.test";

const testDraftUntilUserOrEnd = async (numNow, numTotal) => {
    const pids = await draft.untilUserOrEnd();
    assert.equal(pids.length, numNow);
    const players = await idb.cache.players.indexGetAll(
        "playersByTid",
        PLAYER.UNDRAFTED,
    );
    assert.equal(players.length, 70 - numTotal);
};

let userPick1;
let userPick2;
const testDraftUser = async round => {
    const draftOrder = await draft.getOrder();
    const pick = draftOrder.shift();
    assert.equal(pick.round, round);
    if (round === 1) {
        assert.equal(pick.pick, userPick1);
    } else {
        assert.equal(pick.pick, userPick2 - 30);
    }
    assert.equal(pick.tid, g.userTid);

    const p = await idb.cache.players.indexGet(
        "playersByTid",
        PLAYER.UNDRAFTED,
    );
    await draft.selectPlayer(pick, p.pid);
    assert.equal(p.tid, g.userTid);
    await draft.setOrder(draftOrder);
};

describe("worker/core/draft/untilUserOrEnd", () => {
    before(async () => {
        await loadTeamSeasons();
        idb.league = testHelpers.mockIDBLeague();

        await draft.genPlayers(PLAYER.UNDRAFTED, 15.5);

        const draftTids = await getDraftTids();
        userPick1 = draftTids.indexOf(g.userTid) + 1;
        userPick2 = draftTids.lastIndexOf(g.userTid) + 1;
    });
    after(() => {
        idb.league = undefined;
    });

    it("draft players before the user's team first round pick", () => {
        return testDraftUntilUserOrEnd(userPick1 - 1, userPick1 - 1);
    });

    it("then allow the user to draft in the first round", () => {
        return testDraftUser(1);
    });

    it("when called again after the user drafts, should draft players before the user's second round pick comes up", () => {
        return testDraftUntilUserOrEnd(
            userPick2 - userPick1 - 1,
            userPick2 - 1,
        );
    });

    it("then allow the user to draft in the second round", () => {
        return testDraftUser(2);
    });

    it("when called again after the user drafts, should draft more players to finish the draft", () => {
        const numAfter = 60 - userPick2;
        return testDraftUntilUserOrEnd(numAfter, userPick2 + numAfter);
    });
});
