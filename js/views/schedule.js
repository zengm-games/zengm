/**
 * @name views.schedule
 * @namespace Show current schedule for user's team.
 */
define(["db", "globals", "ui", "core/season", "lib/jquery", "lib/knockout", "util/bbgmView", "util/viewHelpers"], function (db, g, ui, season, $, ko, bbgmView, viewHelpers) {
    "use strict";

    var mapping;

    mapping = {
        games: {
            create: function (options) {
                return options.data;
            }
        }
    };

    function updateSchedule(inputs, updateEvents, vm) {
        var deferred, vars, tx;

        if (updateEvents.indexOf("firstRun") >= 0 || updateEvents.indexOf("gameSim") >= 0) {
            deferred = $.Deferred();
            vars = {};

            season.getSchedule(null, 0, function (schedule_) {
                var data, game, games, i, row, team0, team1;

                games = [];
                for (i = 0; i < schedule_.length; i++) {
                    game = schedule_[i];
                    if (g.userTid === game.homeTid || g.userTid === game.awayTid) {
                        team0 = {tid: game.homeTid, abbrev: game.homeAbbrev, region: game.homeRegion, name: game.homeName};
                        team1 = {tid: game.awayTid, abbrev: game.awayAbbrev, region: game.awayRegion, name: game.awayName};
                        if (g.userTid === game.homeTid) {
                            row = {teams: [team1, team0], vsat: "vs"};
                        } else {
                            row = {teams: [team0, team1], vsat: "at"};
                        }
                        games.push(row);
                    }
                }
                vars = {games: games};
                deferred.resolve(vars);
            });

            return deferred.promise();
        }
    }

    function uiOnce() {
        ui.title("Schedule");
    }

    return bbgmView.init({
        id: "schedule",
        mapping: mapping,
        runBefore: [updateSchedule],
        uiOnce: uiOnce
    });
});