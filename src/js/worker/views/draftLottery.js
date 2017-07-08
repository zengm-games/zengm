// @flow

import {PHASE, g} from '../../common';
import {draft} from '../core';
import {idb} from '../db';
import type {DraftLotteryResultArray, UpdateEvents} from '../../common/types';

async function updateDraftLottery(
    {season}: {season: number},
    updateEvents: UpdateEvents,
    state: any,
): Promise<{
    result: DraftLotteryResultArray | void,
    season: number,
    type: 'completed' | 'projected',
}> {
    if (updateEvents.includes('firstRun') || season !== state.season || (season === g.season && updateEvents.includes('gameSim'))) {
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
}

export default {
    runBefore: [updateDraftLottery],
};
