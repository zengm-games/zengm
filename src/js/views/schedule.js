const g = require('../globals');
const ui = require('../ui');
const season = require('../core/season');
const ko = require('knockout');
const bbgmView = require('../util/bbgmView');
const helpers = require('../util/helpers');
const components = require('./components');

function get(req) {
    const inputs = {};
    [inputs.tid, inputs.abbrev] = helpers.validateAbbrev(req.params.abbrev);
    return inputs;
}

function InitViewModel() {
    this.abbrev = ko.observable();

    this.completed = {
        loading: ko.observable(true), // Needed because this isn't really set until updateCompleted, which could be after first render
        games: ko.observableArray([])
    };
}

const mapping = {
    upcoming: {
        create: options => options.data
    }
};

async function updateUpcoming(inputs, updateEvents, vm) {
    if (updateEvents.indexOf("dbChange") >= 0 || updateEvents.indexOf("firstRun") >= 0 || updateEvents.indexOf("gameSim") >= 0 || inputs.abbrev !== vm.abbrev()) {
        const schedule = await season.getSchedule();
        const games = [];
        for (let i = 0; i < schedule.length; i++) {
            const game = schedule[i];
            if (inputs.tid === game.homeTid || inputs.tid === game.awayTid) {
                const team0 = {tid: game.homeTid, abbrev: g.teamAbbrevsCache[game.homeTid], region: g.teamRegionsCache[game.homeTid], name: g.teamNamesCache[game.homeTid]};
                const team1 = {tid: game.awayTid, abbrev: g.teamAbbrevsCache[game.awayTid], region: g.teamRegionsCache[game.awayTid], name: g.teamNamesCache[game.awayTid]};

                let row;
                if (inputs.tid === game.homeTid) {
                    row = {teams: [team1, team0], vsat: "at"};
                } else {
                    row = {teams: [team1, team0], vsat: "at"};
                }
                games.push(row);
            }
        }

        return {
            abbrev: inputs.abbrev,
            season: g.season,
            upcoming: games
        };
    }
}

// Based on views.gameLog.updateGamesList
async function updateCompleted(inputs, updateEvents, vm) {
    if (updateEvents.indexOf("dbChange") >= 0 || updateEvents.indexOf("firstRun") >= 0 || inputs.abbrev !== vm.abbrev()) {
        // Load all games in list
        vm.completed.loading(true);
        vm.completed.games([]);
        const games = await helpers.gameLogList(inputs.abbrev, g.season, -1, vm.completed.games());
        for (let i = 0; i < games.length; i++) {
            games[i] = helpers.formatCompletedGame(games[i]);
        }

        vm.completed.games(games);
        vm.completed.loading(false);
    }
    if (updateEvents.indexOf("gameSim") >= 0) {
        // Partial update of only new games
        const games = await helpers.gameLogList(inputs.abbrev, g.season, -1, vm.completed.games());
        for (let i = games.length - 1; i >= 0; i--) {
            games[i] = helpers.formatCompletedGame(games[i]);
            vm.completed.games.unshift(games[i]);
        }
    }
}

function uiFirst() {
    ui.title("Schedule");
}

function uiEvery(updateEvents, vm) {
    components.dropdown("schedule-dropdown", ["teams"], [vm.abbrev()], updateEvents);
}

module.exports = bbgmView.init({
    id: "schedule",
    get,
    InitViewModel,
    mapping,
    runBefore: [updateUpcoming],
    runWhenever: [updateCompleted],
    uiFirst,
    uiEvery
});
