/**
 * @name views.playoffs
 * @namespace Show current or archived playoffs, or projected matchups for an in-progress season.
 */
define(["db", "globals", "ui", "core/season", "lib/jquery", "lib/knockout", "util/bbgmView", "util/helpers", "util/viewHelpers", "views/components"], function (db, g, ui, season, $, ko, bbgmView, helpers, viewHelpers, components) {
    "use strict";

    function get(req) {
        return {
            season: helpers.validateSeason(req.params.season)
        };
    }

    function updatePlayoffs(inputs, updateEvents, vm) {
        var attributes, deferred, seasonAttributes, vars;

        if (updateEvents.indexOf("firstRun") >= 0 || inputs.season !== vm.season() || (inputs.season === g.season && updateEvents.indexOf("gameSim") >= 0)) {
            deferred = $.Deferred();
            vars = {};

            if (inputs.season === g.season && g.phase < g.PHASE.PLAYOFFS) {
                // In the current season, before playoffs start, display projected matchups
                attributes = ["tid", "cid", "abbrev", "name"];
                seasonAttributes = ["winp"];
                db.getTeams(null, inputs.season, attributes, [], seasonAttributes, {sortBy: "winp"}, function (teams) {
                    var cid, i, j, keys, series, teamsConf;

                    series = [[], [], [], []];  // First round, second round, third round, fourth round
                    for (cid = 0; cid < 2; cid++) {
                        teamsConf = [];
                        for (i = 0; i < teams.length; i++) {
                            if (teams[i].cid === cid) {
                                teamsConf.push(teams[i]);
                            }
                        }
                        series[0][cid * 4] = {home: teamsConf[0], away: teamsConf[7]};
                        series[0][cid * 4].home.seed = 1;
                        series[0][cid * 4].away.seed = 8;
                        series[0][1 + cid * 4] = {home: teamsConf[1], away: teamsConf[6]};
                        series[0][1 + cid * 4].home.seed = 2;
                        series[0][1 + cid * 4].away.seed = 7;
                        series[0][2 + cid * 4] = {home: teamsConf[2], away: teamsConf[5]};
                        series[0][2 + cid * 4].home.seed = 3;
                        series[0][2 + cid * 4].away.seed = 6;
                        series[0][3 + cid * 4] = {home: teamsConf[3], away: teamsConf[4]};
                        series[0][3 + cid * 4].home.seed = 4;
                        series[0][3 + cid * 4].away.seed = 5;
                    }

                    vars = {finalMatchups: true, series: series, season: inputs.season};
                    deferred.resolve(vars);
                });
            } else {
                // Display the current or archived playoffs
                g.dbl.transaction("playoffSeries").objectStore("playoffSeries").get(inputs.season).onsuccess = function (event) {
                    var playoffSeries, series;

                    playoffSeries = event.target.result;
                    series = playoffSeries.series;

                    vars = {finalMatchups: true, series: series, season: inputs.season};
                    deferred.resolve(vars);
                };
            }

            return deferred.promise();
        }
    }

    function uiFirst(vm) {
        ko.computed(function () {
            ui.title("Playoffs - " + vm.season());
        }).extend({throttle: 1});
    }

    function uiEvery(updateEvents, vm) {
        components.dropdown("playoffs-dropdown", ["seasons"], [vm.season()], updateEvents);
    }

    return bbgmView.init({
        id: "playoffs",
        get: get,
        runBefore: [updatePlayoffs],
        uiFirst: uiFirst,
        uiEvery: uiEvery
    });
});