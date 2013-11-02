/**
 * @name views.live
 * @namespace Live play-by-play game simulation.
 */
define(["globals", "ui", "core/season", "lib/jquery", "lib/knockout", "util/bbgmView", "util/viewHelpers"], function (g, ui, season, $, ko, bbgmView, viewHelpers) {
    "use strict";

    function InitViewModel() {
        this.inProgress = ko.observable(false);
        this.games = ko.observable();
    }

    function updateGamesList(inputs, updateEvents, vm) {
        var deferred;

        if (!vm.inProgress() && (updateEvents.indexOf("firstRun") >= 0 || updateEvents.indexOf("dbChange") >= 0 || updateEvents.indexOf("gameSim") >= 0)) {
            deferred = $.Deferred();

            season.getSchedule(null, 1, function (games) {
                var i;

                for (i = 0; i < games.length; i++) {
                    if (games[i].awayTid === g.userTid || games[i].homeTid === g.userTid) {
                        games[i].highlight = true;
                    } else {
                        games[i].highlight = false;
                    }
                }
console.log(games);

                deferred.resolve({
                    games: games
                });
            });

            return deferred.promise();
        }
    }

    function uiFirst() {
        ui.title("Live Game Simulation");
    }

    return bbgmView.init({
        id: "live",
        InitViewModel: InitViewModel,
        runBefore: [updateGamesList],
        uiFirst: uiFirst
    });
});