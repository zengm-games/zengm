// @flow

import genPicks from "./genPicks";
import lotterySort from "./lotterySort";
import { idb } from "../../db";
import { g, helpers } from "../../util";

const genOrder = async (mock?: boolean = false): Promise<void> => {
    const teams = await idb.getCopies.teamsPlus({
        attrs: ["tid", "cid"],
        seasonAttrs: ["winp", "playoffRoundsWon", "won", "lost"],
        season: g.season,
    });

    lotterySort(teams);

    let draftPicks = await idb.cache.draftPicks.indexGetAll(
        "draftPicksBySeason",
        g.season,
    );

    // Sometimes picks just fail to generate or get lost, for reasons I don't understand
    if (draftPicks.length < g.numDraftRounds * g.numTeams) {
        await genPicks(g.season, draftPicks);
        draftPicks = await idb.cache.draftPicks.indexGetAll(
            "draftPicksBySeason",
            g.season,
        );
    }

    // Because we're editing this later, and sometimes this is called with mock=true
    draftPicks = helpers.deepCopy(draftPicks);

    // Reorganize this to an array indexed on originalTid and round
    const draftPicksIndexed = [];
    for (const dp of draftPicks) {
        const tid = dp.originalTid;
        // Initialize to an array
        if (
            draftPicksIndexed.length < tid ||
            draftPicksIndexed[tid] === undefined
        ) {
            draftPicksIndexed[tid] = [];
        }
        draftPicksIndexed[tid][dp.round] = dp;
    }

    for (let round = 1; round <= g.numDraftRounds; round++) {
        for (let i = 0; i < teams.length; i++) {
            const dp = draftPicksIndexed[teams[i].tid][round];
            if (dp === undefined) {
                throw new Error(`No draft pick found for round ${round}`);
            }
            dp.pick = i + 1;
        }
    }

    if (!mock) {
        for (const dp of draftPicks) {
            await idb.cache.draftPicks.put(dp);
        }
    }
};

export default genOrder;
