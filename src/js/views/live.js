const g = require('../globals');
const ui = require('../ui');
const season = require('../core/season');
const $ = require('jquery');
const ko = require('knockout');
const bbgmView = require('../util/bbgmView');

function disableButtons() {
    $("#live-games-list button").attr("disabled", "disabled");
    $("#game-sim-warning").show();
}

function enableButtons() {
    $("#live-games-list button").removeAttr("disabled");
    $("#game-sim-warning").hide();
}

function InitViewModel() {
    // inProgress is true: game simulation is running, but not done. disable form.
    this.inProgress = ko.observable(false);
    this.disableButtons = ko.observable(false); // HACK

    this.games = ko.observable();
    this.speed = ko.observable(1);

    // See views.gameLog for explanation
    this.boxScore = {
        gid: ko.observable(-1)
    };
    this.showBoxScore = ko.computed(function () {
        return this.boxScore.gid() >= 0;
    }, this).extend({throttle: 1});
}

async function updateGamesList(inputs, updateEvents, vm) {
    if (!vm.inProgress()) {
        const games = await season.getSchedule({oneDay: true});

        for (const game of games) {
            if (game.awayTid === g.userTid || game.homeTid === g.userTid) {
                game.highlight = true;
            } else {
                game.highlight = false;
            }
            game.awayRegion = g.teamRegionsCache[game.awayTid];
            game.awayName = g.teamNamesCache[game.awayTid];
            game.homeRegion = g.teamRegionsCache[game.homeTid];
            game.homeName = g.teamNamesCache[game.homeTid];
        }

        return {
            games,
            boxScore: {gid: -1}
        };
    }
}

function uiFirst(vm) {
    ui.title("Live Game Simulation");

    // The rest is handled in post(). This is needed to get at vm.
    $("#live-games-list").on("click", "button", () => {
        vm.inProgress(true);
    });

    $("#live-games-list").on("gameSimulationStart", () => {
        if (!vm.inProgress()) {
            vm.disableButtons(true);
            disableButtons();
        }
    });
    $("#live-games-list").on("gameSimulationStop", () => {
        if (!vm.inProgress()) {
            // HACK: if this enables too early, it's bad because two identical days will be simulated
            window.setTimeout(() => {
                vm.disableButtons(false);
                enableButtons();
            }, 1000);
        }
    });
}

module.exports = bbgmView.init({
    id: "live",
    InitViewModel,
    runBefore: [updateGamesList],
    uiFirst
});
