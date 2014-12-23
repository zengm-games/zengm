/**
 * @name views.live
 * @namespace Live play-by-play game simulation.
 */
define(["globals", "ui", "core/season", "lib/jquery", "lib/knockout", "util/bbgmView"], function (g, ui, season, $, ko, bbgmView) {
    "use strict";

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

    function updateGamesList(inputs, updateEvents, vm) {
        if (!vm.inProgress()) {
            return season.getSchedule({oneDay: true}).then(function (games) {
                var i;

                for (i = 0; i < games.length; i++) {
                    if (games[i].awayTid === g.userTid || games[i].homeTid === g.userTid) {
                        games[i].highlight = true;
                    } else {
                        games[i].highlight = false;
                    }
                    games[i].awayRegion = g.teamRegionsCache[games[i].awayTid];
                    games[i].awayName = g.teamNamesCache[games[i].awayTid];
                    games[i].homeRegion = g.teamRegionsCache[games[i].homeTid];
                    games[i].homeName = g.teamNamesCache[games[i].homeTid];
                }

                return {
                    games: games,
                    boxScore: {gid: -1}
                };
            });
        }
    }

    function uiFirst(vm) {
        ui.title("Live Game Simulation");

        // The rest is handled in post(). This is needed to get at vm.
        $("#live-games-list").on("click", "button", function () {
            vm.inProgress(true);
        });

        $("#live-games-list").on("gameSimulationStart", function () {
            if (!vm.inProgress()) {
                vm.disableButtons(true);
                disableButtons();
            }
        });
        $("#live-games-list").on("gameSimulationStop", function () {
            if (!vm.inProgress()) {
                // HACK: if this enables too early, it's bad because two identical days will be simulated
                window.setTimeout(function () {
                    vm.disableButtons(false);
                    enableButtons();
                }, 1000);
            }
        });
    }

    return bbgmView.init({
        id: "live",
        InitViewModel: InitViewModel,
        runBefore: [updateGamesList],
        uiFirst: uiFirst
    });
});