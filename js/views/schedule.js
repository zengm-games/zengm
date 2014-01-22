/**
 * @name views.schedule
 * @namespace Show current schedule for user's team.
 */
define(["db", "globals", "ui", "core/season", "lib/jquery", "util/bbgmView", "util/viewHelpers"], function (db, g, ui, season, $, bbgmView, viewHelpers) {
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
        var deferred, vars;

        if (updateEvents.indexOf("dbChange") >= 0 || updateEvents.indexOf("firstRun") >= 0 || updateEvents.indexOf("gameSim") >= 0) {
            deferred = $.Deferred();
            vars = {};

            season.getSchedule(null, 0, function (schedule_) {
                var data, game, games, i, row, team0, team1;

                games = [];
                for (i = 0; i < schedule_.length; i++) {
                    game = schedule_[i];
                    if (g.userTid === game.homeTid || g.userTid === game.awayTid) {
                        team0 = {tid: game.homeTid, abbrev: g.teamAbbrevsCache[game.homeTid], region: g.teamRegionsCache[game.homeTid], name: g.teamNamesCache[game.homeTid]};
                        team1 = {tid: game.awayTid, abbrev: g.teamAbbrevsCache[game.awayTid], region: g.teamRegionsCache[game.awayTid], name: g.teamNamesCache[game.awayTid]};
                        if (g.userTid === game.homeTid) {
                            row = {teams: [team1, team0], vsat: "at"};
                        } else {
                            row = {teams: [team0, team1], vsat: "vs"};
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

    function uiFirst() {
        ui.title("Schedule");
    }

    return bbgmView.init({
        id: "schedule",
        mapping: mapping,
        runBefore: [updateSchedule],
        uiFirst: uiFirst
    });
});