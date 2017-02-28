// @flow

import {g} from '../../common';
import {getCopy} from '../db';
import type {GetOutput, UpdateEvents} from '../../common/types';

async function updateLeagueFinances(
    inputs: GetOutput,
    updateEvents: UpdateEvents,
    state: any,
): void | {[key: string]: any} {
    if (updateEvents.includes('dbChange') || updateEvents.includes('firstRun') || inputs.season !== state.season || inputs.season === g.season) {
        const teams = await getCopy.teams({
            attrs: ["tid", "abbrev", "region", "name"],
            seasonAttrs: ["att", "revenue", "profit", "cash", "payroll", "salaryPaid"],
            season: inputs.season,
        });

        return {
            season: inputs.season,
            salaryCap: g.salaryCap / 1000,
            minPayroll: g.minPayroll / 1000,
            luxuryPayroll: g.luxuryPayroll / 1000,
            luxuryTax: g.luxuryTax,
            teams,
        };
    }
}

export default {
    runBefore: [updateLeagueFinances],
};
