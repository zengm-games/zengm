// @flow

import {PHASE, g} from '../../common';
import {draft} from '../core';
import {idb} from '../db';
import type {DraftLotteryResultArray} from '../../common/types';

async function updateDraftLottery(
    {season}: {season: number},
): Promise<{
    result: DraftLotteryResultArray | void,
    season: number,
    type: 'completed' | 'projected',
}> {
    // View completed draft lottery
    if (season < g.season || season === g.season && g.phase >= PHASE.DRAFT) {
        const draftLotteryResult = await idb.getCopy.draftLotteryResults({season});

        const result = draftLotteryResult !== undefined ? draftLotteryResult.result : undefined;

        return {
            result,
            season,
            type: 'completed',
        };
    }

    // View projected draft lottery for this season
    const draftLotteryResult = await draft.genOrder(true);

    for (const pick of draftLotteryResult.result) {
        pick.pick = undefined;
    }

    return {
        result: draftLotteryResult.result,
        season: draftLotteryResult.season,
        type: 'projected',
    };
}

export default {
    runBefore: [updateDraftLottery],
};
