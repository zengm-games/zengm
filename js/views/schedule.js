/**
 * @name views.schedule
 * @namespace Show current schedule for user's team.
 */
define(["globals", "ui", "core/season", "lib/knockout", "util/bbgmView", "util/helpers", "views/components"], function (g, ui, season, ko, bbgmView, helpers, components) {
    "use strict";

    var mapping;

    function get(req) {
        var inputs, out;

        inputs = {};

        out = helpers.validateAbbrev(req.params.abbrev);
        inputs.tid = out[0];
        inputs.abbrev = out[1];

        return inputs;
    }

    function InitViewModel() {
        this.abbrev = ko.observable();

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
        if (updateEvents.indexOf("dbChange") >= 0 || updateEvents.indexOf("firstRun") >= 0 || updateEvents.indexOf("gameSim") >= 0 || inputs.abbrev !== vm.abbrev()) {
            return season.getSchedule().then(function (schedule_) {
                var game, games, i, row, team0, team1;

                games = [];
                for (i = 0; i < schedule_.length; i++) {
                    game = schedule_[i];
                    if (inputs.tid === game.homeTid || inputs.tid === game.awayTid) {
                        team0 = {tid: game.homeTid, abbrev: g.teamAbbrevsCache[game.homeTid], region: g.teamRegionsCache[game.homeTid], name: g.teamNamesCache[game.homeTid]};
                        team1 = {tid: game.awayTid, abbrev: g.teamAbbrevsCache[game.awayTid], region: g.teamRegionsCache[game.awayTid], name: g.teamNamesCache[game.awayTid]};
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
            });
        }
    }

    // Based on views.gameLog.updateGamesList
    function updateCompleted(inputs, updateEvents, vm) {
        if (updateEvents.indexOf("dbChange") >= 0 || updateEvents.indexOf("firstRun") >= 0 || inputs.abbrev !== vm.abbrev()) {
            // Load all games in list
            vm.completed.loading(true);
            vm.completed.games([]);
            return helpers.gameLogList(inputs.abbrev, g.season, -1, vm.completed.games()).then(function (games) {
                var i;

                for (i = 0; i < games.length; i++) {
                    games[i] = helpers.formatCompletedGame(games[i]);
                }

                vm.completed.games(games);
                vm.completed.loading(false);
            });
        }
        if (updateEvents.indexOf("gameSim") >= 0) {
            // Partial update of only new games
            return helpers.gameLogList(inputs.abbrev, g.season, -1, vm.completed.games()).then(function (games) {
                var i;
                for (i = games.length - 1; i >= 0; i--) {
                    games[i] = helpers.formatCompletedGame(games[i]);
                    vm.completed.games.unshift(games[i]);
                }
            });
        }
    }

    function uiFirst() {
        ui.title("Schedule");
    }

    function uiEvery(updateEvents, vm) {
        components.dropdown("schedule-dropdown", ["teams"], [vm.abbrev()], updateEvents);
    }

    return bbgmView.init({
        id: "schedule",
        get: get,
        InitViewModel: InitViewModel,
        mapping: mapping,
        runBefore: [updateUpcoming],
        runWhenever: [updateCompleted],
        uiFirst: uiFirst,
        uiEvery: uiEvery
    });
});