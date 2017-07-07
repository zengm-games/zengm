// @flow

import {idb} from '../../db';
import type {Awards} from '../../../common/types';

const getCopy = async ({season}: {season: number}): Promise<Awards | void> => {
    const result = await idb.getCopies.draftLotteryResults({season});
    return result[0];
};

export default getCopy;
