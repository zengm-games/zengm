// @flow

import {g} from '../../common';
import type {GetOutput, UpdateEvents} from '../../common/types';

async function updateOptions(
    inputs: GetOutput,
    updateEvents: UpdateEvents,
): void | {[key: string]: any} {
    if (updateEvents.includes('firstRun')) {
        return {
            autoDeleteOldBoxScores: g.autoDeleteOldBoxScores,
        };
    }
}

export default {
    runBefore: [updateOptions],
};
