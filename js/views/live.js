/**
 * @name views.live
 * @namespace Live play-by-play game simulation.
 */
define(["globals", "ui", "core/game", "core/season", "lib/jquery", "lib/knockout", "util/bbgmView", "util/viewHelpers"], function (g, ui, game, season, $, ko, bbgmView, viewHelpers) {
    "use strict";

    function get(req) {
        if (req.raw.playByPlay !== undefined) {
console.log('GET');
            return {
                gidPlayByPlay: req.raw.gidPlayByPlay,
                playByPlay: req.raw.playByPlay
            };
        }
    }

    function post(req) {
        var gid;

        gid = parseInt(req.params.gid, 10);

        $("#games-list button").attr("disabled", "disabled");

        // Start 1 day of game simulation
        // Prevent any redirects, somehow
        // Get play by play for gid through raw of ui.realtimeUpdate
        // gameSim with playByPlay in raw leads to display of play by play in updatePlayByPlay
        // set inProgress to false
        game.play(1, true, gid);
    }

    function InitViewModel() {
        // inProgress is true: game simulation is running, but not done. disable form.
        // playByPlay length > 0: game simulation result is here, hide form and show play by play
        this.inProgress = ko.observable(false);
        this.games = ko.observable();
        this.playByPlay = ko.observableArray();

        // See views.gameLog for explanation
        this.boxScore = {
            gid: ko.observable(-1)
        };
        this.showBoxScore = ko.computed(function () {
            return this.boxScore.gid() >= 0;
        }, this).extend({throttle: 1});
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

    function updatePlayByPlay(inputs, updateEvents, vm) {
        var deferred, events;

        function processToNextPause() {
            var e, stop, text;

            stop = false;
            while (!stop && events.length > 0) {
                e = events.shift();
                if (e.type === "text") {
                    text = e.text;
                    stop = true;
                }
            }

            vm.playByPlay.unshift(text);

            if (events.length > 0) {
                setTimeout(processToNextPause, 1000 * Math.random());
            }
        }

        if (vm.inProgress() && inputs.playByPlay !== undefined && inputs.playByPlay.length > 0) {
            deferred = $.Deferred();

            events = inputs.playByPlay;

            g.dbl.transaction("games").objectStore("games").get(inputs.gidPlayByPlay).onsuccess = function (event) {
                var boxScore, i, j, resetStats, s;

                // Stats to set to 0
                resetStats = ["min", "fg", "fga", "tp", "tpa", "ft", "fta", "orb", "trb", "ast", "tov", "stl", "blk", "pf", "pts"];

                boxScore = event.target.result;
                for (i = 0; i < boxScore.teams.length; i++) {
                    boxScore.teams[i].ptsQtrs = [0, 0, 0, 0];
                    for (s = 0; s < resetStats.length; s++) {
                        boxScore.teams[i][resetStats[s]] = 0;
                    }
                    for (j = 0; j < boxScore.teams[i].players.length; j++) {
                        for (s = 0; s < resetStats.length; s++) {
                            boxScore.teams[i].players[j][resetStats[s]] = 0;
                        }
                    }
                }

                // Start showing play-by-play
                processToNextPause();

                deferred.resolve({
                    boxScore: boxScore
                });
            };

            return deferred.promise();
        }
    }

    function uiFirst(vm) {
        ui.title("Live Game Simulation");

        // The rest is handled in post(). This is needed to get at vm.
        $("#games-list").on("click", "button", function () {
            vm.inProgress(true);
        });
    }

    return bbgmView.init({
        id: "live",
        get: get,
        post: post,
        InitViewModel: InitViewModel,
        runBefore: [updateGamesList, updatePlayByPlay],
        uiFirst: uiFirst
    });
});