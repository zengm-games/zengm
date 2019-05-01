// @flow

import assert from "assert";
import sampleTiebreakers from "../../../test/fixtures/sampleTiebreakers";
import testHelpers from "../../../test/helpers";
import { draft } from "..";
import { idb } from "../../db";
import { g, helpers } from "../../util";

const getDraftTids = async () => {
    await draft.genOrderNBA();
    const draftPicks = await draft.getOrder();
    assert.equal(draftPicks.length, 60);

    return draftPicks.map(d => d.originalTid);
};

const loadTeamSeasons = async () => {
    testHelpers.resetG();
    await testHelpers.resetCache();

    g.draftType = "nba1994";

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
