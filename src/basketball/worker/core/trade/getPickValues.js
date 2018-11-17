// @flow

import { PHASE, PLAYER } from "../../../../deion/common";
import { idb } from "../../db";
import { g } from "../../util";
import type { TradePickValues } from "../../../../deion/common/types";

/**
 * Estimate draft pick values, based on the generated draft prospects in the database.
 *
 * This was made for team.valueChange, so it could be called once and the results cached.
 *
 * @memberOf core.trade
 * @return {Promise.Object} Resolves to estimated draft pick values.
 */
const getPickValues = async (): Promise<TradePickValues> => {
    const estValues = {
        default: [
            75,
            73,
            71,
            69,
            68,
            67,
            66,
            65,
            64,
            63,
            62,
            61,
            60,
            59,
            58,
            57,
            56,
            55,
            54,
            53,
            52,
            51,
            50,
            50,
            50,
            49,
            49,
            49,
            48,
            48,
            48,
            47,
            47,
            47,
            46,
            46,
            46,
            45,
            45,
            45,
            44,
            44,
            44,
            43,
            43,
            43,
            42,
            42,
            42,
            41,
            41,
            41,
            40,
            40,
            39,
            39,
            38,
            38,
            37,
            37,
        ], // This is basically arbitrary
    };

    for (const tid of [
        PLAYER.UNDRAFTED,
        PLAYER.UNDRAFTED_2,
        PLAYER.UNDRAFTED_3,
    ]) {
        const players = await idb.cache.players.indexGetAll(
            "playersByTid",
            tid,
        );
        if (players.length > 0) {
            players.sort((a, b) => b.value - a.value);
            estValues[players[0].draft.year] = players.map(p => p.value + 4); // +4 is to generally make picks more valued
        }
    }

    // Handle case where draft is in progress
    if (g.phase === PHASE.DRAFT) {
        // See what the lowest remaining pick is
        const numPicks = 2 * g.numTeams;
        const draftPicks = (await idb.cache.draftPicks.getAll()).filter(
            dp => dp.season === g.season,
        );
        const diff = numPicks - draftPicks.length;
        if (diff > 0) {
            // Value of 50 is arbitrary since these entries should never appear in a trade since the picks don't exist anymore
            const fakeValues = Array(diff).fill(50);
            estValues[g.season] = fakeValues.concat(estValues[g.season]);
        }
    }

    return estValues;
};

export default getPickValues;
