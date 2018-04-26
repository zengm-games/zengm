// @flow

import assert from "assert";
import { helpers } from "../../../common";
import sampleTiebreakers from "../../../test/fixtures/sampleTiebreakers";
import testHelpers from "../../../test/helpers";
import { draft } from "..";
import { idb } from "../../db";

const getDraftTids = async () => {
    await draft.genOrder();
    const draftOrder = await draft.getOrder();
    assert.equal(draftOrder.length, 60);

    return draftOrder.map(d => d.originalTid);
};

const loadTeamSeasons = async () => {
    testHelpers.resetG();
    await testHelpers.resetCache();

    // Load static data
    for (const st of sampleTiebreakers) {
        const t = helpers.deepCopy(st);
        const teamSeasons = t.seasons;
        delete t.seasons;
        delete t.stats;

        for (const teamSeason of teamSeasons) {
            teamSeason.tid = t.tid;
            await idb.cache.teamSeasons.add(teamSeason);
        }

        await idb.cache.teams.add(t);
    }
};

export { getDraftTids, loadTeamSeasons };
