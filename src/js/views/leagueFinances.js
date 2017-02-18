// @flow

import g from '../globals';
import {getCopy} from '../db';
import bbgmViewReact from '../util/bbgmViewReact';
import * as helpers from '../util/helpers';
import LeagueFinances from './views/LeagueFinances';

function get(ctx) {
    return {
        season: helpers.validateSeason(ctx.params.season),
    };
}

async function updateLeagueFinances(inputs, updateEvents, state) {
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

export default bbgmViewReact.init({
    id: "leagueFinances",
    get,
    runBefore: [updateLeagueFinances],
    Component: LeagueFinances,
});
