const g = require('../globals');
const team = require('../core/team');
const bbgmViewReact = require('../util/bbgmViewReact');
const helpers = require('../util/helpers');
const LeagueFinances = require('./views/LeagueFinances');

function get(req) {
    return {
        season: helpers.validateSeason(req.params.season),
    };
}

async function updateLeagueFinances(inputs, updateEvents, state) {
    if (updateEvents.indexOf("dbChange") >= 0 || updateEvents.indexOf("firstRun") >= 0 || inputs.season !== state.season || inputs.season === g.season) {
        const teams = await team.filter({
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

module.exports = bbgmViewReact.init({
    id: "leagueFinances",
    get,
    runBefore: [updateLeagueFinances],
    Component: LeagueFinances,
});
