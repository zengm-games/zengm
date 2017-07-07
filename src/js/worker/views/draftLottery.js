// @flow

//import {PHASE, PLAYER, g} from '../../common';
//import {draft} from '../core';
import {idb} from '../db';
import type {DraftLotteryResultArray} from '../../common/types';

async function updateDraftLottery(
    {season}: {season: number},
): Promise<{
    result: DraftLotteryResultArray | void,
    season: number,
}> {
    const draftLotteryResult = await idb.getCopy.draftLotteryResults({season});

    const result = draftLotteryResult !== undefined ? draftLotteryResult.result : undefined;

    return {
        result,
        season,
    };
}

export default {
    runBefore: [updateDraftLottery],
};
