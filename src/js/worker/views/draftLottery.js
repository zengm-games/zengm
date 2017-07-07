// @flow

//import {PHASE, PLAYER, g} from '../../common';
//import {draft} from '../core';
//import {idb} from '../db';
import type {DraftLotteryResult} from '../../common/types';

async function updateDraftLottery(
    inputs: {season: number},
): {
    result: DraftLotteryResult | void,
    season: number,
} {
    const result = [{
        tid: 1,
        originalTid: 0,
        chances: 250,
        pick: 1,
        won: 4,
        lost: 15,
    }, {
        tid: 2,
        originalTid: 2,
        chances: 199,
        pick: 2,
        won: 4,
        lost: 15,
    }, {
        tid: 3,
        originalTid: 3,
        chances: 156,
        pick: 3,
        won: 4,
        lost: 15,
    }, {
        tid: 4,
        originalTid: 4,
        chances: 119,
        pick: 4,
        won: 4,
        lost: 15,
    }, {
        tid: 5,
        originalTid: 5,
        chances: 88,
        pick: 5,
        won: 4,
        lost: 15,
    }, {
        tid: 6,
        originalTid: 6,
        chances: 63,
        pick: 6,
        won: 4,
        lost: 15,
    }, {
        tid: 7,
        originalTid: 7,
        chances: 43,
        pick: 7,
        won: 4,
        lost: 15,
    }, {
        tid: 8,
        originalTid: 8,
        chances: 28,
        pick: 8,
        won: 4,
        lost: 15,
    }, {
        tid: 9,
        originalTid: 9,
        chances: 17,
        pick: 9,
        won: 4,
        lost: 15,
    }, {
        tid: 10,
        originalTid: 10,
        chances: 11,
        pick: 10,
        won: 4,
        lost: 15,
    }, {
        tid: 11,
        originalTid: 11,
        chances: 8,
        pick: 11,
        won: 4,
        lost: 15,
    }, {
        tid: 12,
        originalTid: 12,
        chances: 7,
        pick: 12,
        won: 4,
        lost: 15,
    }, {
        tid: 13,
        originalTid: 13,
        chances: 6,
        pick: 13,
        won: 4,
        lost: 15,
    }, {
        tid: 14,
        originalTid: 14,
        chances: 5,
        pick: 14,
        won: 4,
        lost: 15,
    }];

    return {
        result,
        season: inputs.season,
    };
}

export default {
    runBefore: [updateDraftLottery],
};
