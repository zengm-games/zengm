const g = require('../globals');
const ui = require('../ui');
const team = require('../core/team');
const ko = require('knockout');
const bbgmView = require('../util/bbgmView');
const helpers = require('../util/helpers');
const components = require('./components');

function get(req) {
    return {
        season: helpers.validateSeason(req.params.season)
    };
}

async function updatePlayoffs(inputs, updateEvents, vm) {
    if (updateEvents.indexOf("dbChange") >= 0 || updateEvents.indexOf("firstRun") >= 0 || inputs.season !== vm.season() || (inputs.season === g.season && updateEvents.indexOf("gameSim") >= 0)) {
        let finalMatchups, series;

        // If in the current season and before playoffs started, display projected matchups
        if (inputs.season === g.season && g.phase < g.PHASE.PLAYOFFS) {
            const teams = await team.filter({
                attrs: ["tid", "cid", "abbrev", "name"],
                seasonAttrs: ["winp"],
                season: inputs.season,
                sortBy: ["winp", "-lost", "won"]
            });

            series = [[], [], [], []];  // First round, second round, third round, fourth round
            for (let cid = 0; cid < 2; cid++) {
                const teamsConf = teams.filter(t => t.cid === cid);
                series[0][cid * 4] = {home: teamsConf[0], away: teamsConf[7]};
                series[0][cid * 4].home.seed = 1;
                series[0][cid * 4].away.seed = 8;
                series[0][3 + cid * 4] = {home: teamsConf[1], away: teamsConf[6]};
                series[0][3 + cid * 4].home.seed = 2;
                series[0][3 + cid * 4].away.seed = 7;
                series[0][2 + cid * 4] = {home: teamsConf[2], away: teamsConf[5]};
                series[0][2 + cid * 4].home.seed = 3;
                series[0][2 + cid * 4].away.seed = 6;
                series[0][1 + cid * 4] = {home: teamsConf[3], away: teamsConf[4]};
                series[0][1 + cid * 4].home.seed = 4;
                series[0][1 + cid * 4].away.seed = 5;
            }

            finalMatchups = false;
        } else {
            const playoffSeries = await g.dbl.playoffSeries.get(inputs.season);
            series = playoffSeries.series;

            finalMatchups = true;
        }

        // Display the current or archived playoffs
        return {
            finalMatchups,
            series,
            season: inputs.season
        };
    }
}

function uiFirst(vm) {
    ko.computed(() => {
        ui.title("Playoffs - " + vm.season());
    }).extend({throttle: 1});
}

function uiEvery(updateEvents, vm) {
    components.dropdown("playoffs-dropdown", ["seasons"], [vm.season()], updateEvents);
}

module.exports = bbgmView.init({
    id: "playoffs",
    get,
    runBefore: [updatePlayoffs],
    uiFirst,
    uiEvery
});
