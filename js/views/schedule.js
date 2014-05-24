/**
 * @name views.schedule
 * @namespace Show current schedule for user's team.
 */
define(["db", "globals", "ui", "core/season", "lib/jquery", "lib/knockout", "util/bbgmView", "util/helpers", "util/viewHelpers"], function (db, g, ui, season, $, ko, bbgmView, helpers, viewHelpers) {
    "use strict";

    var mapping;

    function InitViewModel() {
        this.abbrev = g.teamAbbrevsCache[g.userTid];
        this.season = g.season;

        this.completed = {
            loading: ko.observable(true), // Needed because this isn't really set until updateCompleted, which could be after first render
            games: ko.observableArray([])
        };
    }

    mapping = {
        upcoming: {
            create: function (options) {
                return options.data;
            }
        }
    };

    function updateUpcoming(inputs, updateEvents, vm) {
        var deferred;

        if (updateEvents.indexOf("dbChange") >= 0 || updateEvents.indexOf("firstRun") >= 0 || updateEvents.indexOf("gameSim") >= 0) {
            deferred = $.Deferred();

            season.getSchedule(null, 0, function (schedule_) {
                var game, games, i, row, team0, team1;

                games = [];
                for (i = 0; i < schedule_.length; i++) {
                    game = schedule_[i];
                    if (g.userTid === game.homeTid || g.userTid === game.awayTid) {
                        team0 = {tid: game.homeTid, abbrev: g.teamAbbrevsCache[game.homeTid], region: g.teamRegionsCache[game.homeTid], name: g.teamNamesCache[game.homeTid]};
                        team1 = {tid: game.awayTid, abbrev: g.teamAbbrevsCache[game.awayTid], region: g.teamRegionsCache[game.awayTid], name: g.teamNamesCache[game.awayTid]};
                        if (g.userTid === game.homeTid) {
                            row = {teams: [team1, team0], vsat: "at"};
                        } else {
                            row = {teams: [team1, team0], vsat: "at"};
                        }
                        games.push(row);
                    }
                }
                deferred.resolve({upcoming: games});
            });

            return deferred.promise();
        }
    }

    // Based on views.gameLog.updateGamesList
    function updateCompleted(inputs, updateEvents, vm) {
        var deferred;

        deferred = $.Deferred();

        if (updateEvents.indexOf("dbChange") >= 0 || updateEvents.indexOf("firstRun") >= 0) {
            // Load all games in list
            vm.completed.loading(true);
            vm.completed.games([]);
            helpers.gameLogList(g.teamAbbrevsCache[g.userTid], g.season, -1, vm.completed.games(), function (games) {
                var i;

                for (i = 0; i < games.length; i++) {
                    games[i] = helpers.formatCompletedGame(games[i]);
                }

                vm.completed.games(games);
                vm.completed.loading(false);
                deferred.resolve();
            });
            return deferred.promise();
        }
        if (updateEvents.indexOf("gameSim") >= 0) {
            // Partial update of only new games
            helpers.gameLogList(g.teamAbbrevsCache[g.userTid], g.season, -1, vm.completed.games(), function (games) {
                var i;
                for (i = games.length - 1; i >= 0; i--) {
                    games[i] = helpers.formatCompletedGame(games[i]);
                    vm.completed.games.unshift(games[i]);
                }
                deferred.resolve();
            });
            return deferred.promise();
        }
    }

    function uiFirst() {
        ui.title("Schedule");
    }

    return bbgmView.init({
        id: "schedule",
        InitViewModel: InitViewModel,
        mapping: mapping,
        runBefore: [updateUpcoming],
        runWhenever: [updateCompleted],
        uiFirst: uiFirst
    });
});