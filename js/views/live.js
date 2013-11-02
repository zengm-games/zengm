/**
 * @name views.live
 * @namespace Live play-by-play game simulation.
 */
define(["globals", "ui", "core/season", "lib/jquery", "lib/knockout", "util/bbgmView", "util/viewHelpers"], function (g, ui, season, $, ko, bbgmView, viewHelpers) {
    "use strict";

    function post(req) {
        var gid;

        gid = parseInt(req.params.gid, 10);
console.log(gid);

        // Start 1 day of game simulation
        // Prevent any redirects, somehow
        // Get play by play for gid, maybe store in vm?
        // Somehow initiate display of play by play
        // set inProgress to false
    }

    function InitViewModel() {
        // inProgress is true: game simulation is running, but not done. disable form.
        // playByPlay length > 0: game simulation result is here, hide form and show play by play
        this.inProgress = ko.observable(false);
        this.games = ko.observable();
        this.playByPlay = ko.observable([]);
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

                deferred.resolve({
                    games: games
                });
            });

            return deferred.promise();
        }
    }

    function uiFirst(vm) {
        ui.title("Live Game Simulation");

        // The rest is handled in post(). This is needed to get at vm.
        $("#games-list").on("click", "button", function () {
            $("#games-list button").attr("disabled", "disabled");
            vm.inProgress(true);
        });
    }

    return bbgmView.init({
        id: "live",
        post: post,
        InitViewModel: InitViewModel,
        runBefore: [updateGamesList],
        uiFirst: uiFirst
    });
});