// @flow

import {g} from '../../common';
import * as league from '../core/league';
import type {GetOutput, UpdateEvents} from '../../common/types';

async function updateGodMode(
    inputs: GetOutput,
    updateEvents: UpdateEvents,
): void | {[key: string]: any} {
    if (updateEvents.includes('dbChange') || updateEvents.includes('firstRun') || updateEvents.includes('toggleGodMode')) {
        // Make sure it's current
        await league.loadGameAttributes();

        return {
            godMode: g.godMode,
            disableInjuries: g.disableInjuries,
            numGames: g.numGames,
            quarterLength: g.quarterLength,
            minRosterSize: g.minRosterSize,
            salaryCap: g.salaryCap / 1000,
            minPayroll: g.minPayroll / 1000,
            luxuryPayroll: g.luxuryPayroll / 1000,
            luxuryTax: g.luxuryTax,
            minContract: g.minContract / 1000,
            maxContract: g.maxContract / 1000,
        };
    }
}

export default {
    runBefore: [updateGodMode],
};
