/**
 * @name views.teamStatDists
 * @namespace Team stat distributions.
 */
define(["globals", "ui", "core/team", "lib/boxPlot", "lib/jquery", "lib/knockout", "lib/underscore", "views/components", "util/bbgmView", "util/helpers"], function (g, ui, team, boxPlot, $, ko, _, components, bbgmView, helpers) {
    "use strict";

    var nbaStatsAll;

    nbaStatsAll = {
        won: [50, 42, 43, 40, 55, 61, 36, 58, 57, 17, 57, 46, 37, 39, 24, 52, 22, 41, 32, 62, 23, 30, 56, 48, 19, 44, 46, 24, 34, 35],
        lost: [32, 40, 39, 42, 27, 21, 46, 24, 25, 65, 25, 36, 45, 43, 58, 30, 60, 41, 50, 20, 59, 52, 26, 34, 63, 38, 36, 58, 48, 47],
        fg: [38.4, 38.3, 38.7, 39.3, 37.4, 38.4, 39.6, 37, 38.1, 37.7, 37.4, 39, 36.6, 37.4, 38.2, 36, 38.3, 38.1, 36.8, 37.1, 37.2, 37.3, 36.9, 36, 35.2, 36.2, 35.9, 35.6, 35, 34.3],
        fga: [80.6, 83.7, 85.1, 83.5, 80.6, 80.8, 85.9, 76.8, 82.4, 85.5, 78.8, 82.9, 82.8, 80.4, 85.1, 78.2, 82.4, 82.6, 80.4, 80.3, 84, 81.1, 75.8, 80.5, 81.1, 78.4, 78.2, 81, 77.6, 79.8],
        fgp: [47.6, 45.7, 45.4, 47, 46.4, 47.5, 46.1, 48.1, 46.3, 44.1, 47.5, 47.1, 44.2, 46.5, 44.9, 46.1, 46.5, 46.1, 45.7, 46.2, 44.3, 46, 48.6, 44.7, 43.4, 46.2, 45.9, 44, 45.1, 43],
        tp: [8.1, 9.3, 8.3, 8.5, 5.9, 8.4, 8.4, 6.7, 6.4, 7.2, 7.9, 3.8, 7.1, 5.3, 5.2, 9.4, 4.2, 5.4, 6.3, 6.2, 4.8, 5.8, 5, 6.3, 6.2, 6.1, 5.4, 5.6, 4.8, 5.9],
        tpa: [20.8, 25.4, 22.5, 22.6, 17.1, 21.1, 21.3, 18, 18.1, 19.1, 21.6, 11.3, 20.2, 15.3, 15.6, 25.6, 13.3, 15.2, 18.5, 17.3, 14.4, 15.3, 13.6, 18.3, 18.2, 17.4, 15, 16.3, 14.7, 17.2],
        tpp: [38.8, 36.8, 36.7, 37.7, 34.7, 39.7, 39.2, 37, 35.2, 37.6, 36.5, 33.4, 35.4, 34.6, 33.5, 36.6, 31.6, 35.5, 33.8, 36.1, 33.2, 37.6, 36.5, 34.5, 34.2, 35.2, 36, 34.3, 32.7, 34.2],
        ft: [22.7, 20.6, 20.3, 18, 24.1, 18.5, 15.7, 21.5, 18.8, 18.5, 17.5, 18.1, 19.4, 19.4, 17.7, 17.7, 18.2, 17.4, 18.9, 18.2, 18.2, 16.7, 17.8, 18, 18.9, 16.4, 17.7, 17.4, 18.4, 17.4],
        fta: [29.6, 25.5, 25.4, 23.6, 29.3, 24.2, 20.7, 27.9, 24.1, 24.1, 22.6, 24.2, 24.8, 25.1, 24.2, 25.6, 24.1, 22.6, 26.7, 24.5, 24.4, 22.6, 23.1, 22.4, 25.3, 21.1, 23.1, 22.9, 24.4, 22.9],
        ftp: [76.5, 80.9, 80.1, 75.9, 82.3, 76.7, 76.1, 76.9, 77.9, 76.8, 77.7, 75, 78.2, 77.1, 73.4, 69.2, 75.5, 77, 70.7, 74.3, 74.5, 73.7, 77, 80.4, 74.5, 77.9, 76.5, 75.9, 75.6, 75.7],
        orb: [9.6, 10.3, 11.7, 10, 11, 10.1, 11.6, 9.6, 12.1, 13.2, 9.5, 11.8, 11.1, 11, 13.1, 10.5, 11.7, 10.4, 11.7, 11.8, 12.4, 11.4, 7.8, 12.1, 10.4, 9.3, 10, 11.1, 10.3, 10.5],
        drb: [32.3, 30.1, 31.1, 30.2, 31.8, 31.7, 28.9, 32.5, 31.9, 31.2, 31.9, 29.2, 32.4, 28.5, 30.8, 32.7, 28.6, 31.4, 30.5, 32.4, 29, 27.3, 31, 27.2, 29.9, 30, 30.1, 29.8, 29.8, 30.2],
        trb: [42, 40.5, 42.8, 40.2, 42.8, 41.9, 40.5, 42.1, 44, 44.4, 41.4, 41, 43.5, 39.5, 43.9, 43.2, 40.3, 41.8, 42.1, 44.2, 41.3, 38.6, 38.8, 39.3, 40.3, 39.3, 40.1, 40.8, 40.1, 40.8],
        ast: [22.1, 21.4, 23.8, 23.7, 20.4, 22.4, 22.5, 20, 22, 20.1, 23.8, 20.6, 19.6, 23.4, 20.4, 20, 21.9, 22.7, 22.1, 22.3, 19.4, 21.1, 23.4, 21.2, 21, 22, 20.6, 21, 21.1, 18.8],
        tov: [13.8, 13.3, 12.8, 13.6, 13.5, 12.9, 14.1, 13.2, 12.6, 16.5, 13.5, 13.4, 14.8, 13.6, 15.6, 14.4, 14, 12.2, 15.5, 13.5, 14.7, 12.2, 13.6, 12.4, 13.7, 12.8, 12.2, 13, 13.7, 12.5],
        stl: [7.4, 7.6, 7.1, 6.6, 8, 7.3, 9, 6.6, 7.3, 7.2, 6.8, 9.4, 7.1, 7.7, 7.4, 6.7, 7.1, 7.6, 7.1, 7.2, 8.1, 7.3, 8.2, 8, 6.6, 6.1, 7.6, 5.6, 6.4, 7.5],
        blk: [4.3, 5.8, 4.5, 4.4, 5.9, 4.5, 5, 5.2, 5.1, 5.1, 4.3, 5.4, 5.6, 5.9, 4.8, 4.7, 4.3, 4.3, 4.9, 5.7, 6.1, 4, 4.2, 4.4, 4.2, 4.2, 4.4, 4.7, 5.3, 4.9],
        pf: [21, 21.3, 20, 20.3, 22.4, 19, 22, 20.4, 19, 22.3, 19.2, 20.8, 21.7, 22.7, 22, 20, 22, 19.4, 21.1, 20, 22.6, 19.9, 20.5, 19.3, 20.1, 19, 21, 22, 20, 20.5],
        pts: [107.5, 106.5, 105.9, 105, 104.8, 103.7, 103.4, 102.1, 101.5, 101.1, 100.2, 99.9, 99.8, 99.4, 99.4, 99.2, 99.1, 99, 98.6, 98.6, 97.3, 97, 96.5, 96.3, 95.5, 95, 94.9, 94.2, 93.3, 91.9],
        oppPts: [102.7, 105.7, 103.7, 105.9, 101, 98, 105.7, 94.6, 95.4, 107.7, 96, 97.6, 100.9, 101.3, 104.7, 93.7, 105.4, 97.5, 101.8, 91.3, 104.7, 100.6, 91.1, 94.8, 104.5, 95.8, 94, 100.4, 97.3, 92.7]
    };

    function get(req) {
        return {
            season: helpers.validateSeason(req.params.season)
        };
    }

    function InitViewModel() {
        this.season = ko.observable();
    }

    function updateTeams(inputs, updateEvents, vm) {
        if (updateEvents.indexOf("dbChange") >= 0 || (inputs.season === g.season && (updateEvents.indexOf("gameSim") >= 0 || updateEvents.indexOf("playerMovement") >= 0)) || inputs.season !== vm.season()) {
            return team.filter({
                seasonAttrs: ["won", "lost"],
                stats: ["fg", "fga", "fgp", "tp", "tpa", "tpp", "ft", "fta", "ftp", "orb", "drb", "trb", "ast", "tov", "stl", "blk", "pf", "pts", "oppPts"],
                season: inputs.season
            }).then(function (teams) {
                var statsAll;

                statsAll = _.reduce(teams, function (memo, team) {
                    var stat;
                    for (stat in team) {
                        if (team.hasOwnProperty(stat)) {
                            if (memo.hasOwnProperty(stat)) {
                                memo[stat].push(team[stat]);
                            } else {
                                memo[stat] = [team[stat]];
                            }
                        }
                    }
                    return memo;
                }, {});

                return {
                    season: inputs.season,
                    statsAll: statsAll
                };
            });
        }
    }

    function uiFirst(vm) {
        var stat, tbody;

        ko.computed(function () {
            ui.title("Team Stat Distributions - " + vm.season());
        }).extend({throttle: 1});

        tbody = $("#team-stat-dists tbody");

        for (stat in vm.statsAll) {
            if (vm.statsAll.hasOwnProperty(stat)) {
                tbody.append('<tr><td style="text-align: right; padding-right: 1em;">' + stat + '</td><td width="100%"><div id="' + stat + 'BoxPlot"></div></td></tr>');
                if (nbaStatsAll.hasOwnProperty(stat)) {
                    tbody.append('<tr><td></td><td width="100%"><div id="' + stat + 'BoxPlotNba" style="margin-top: -26px"></div></td></tr>');
                }
            }
        }

        ko.computed(function () {
            var scale, stat;

            // Scales for the box plots. This is not done dynamically so that the plots will be comparable across seasons.
            scale = {
                won: [0, 82],
                lost: [0, 82],
                fg: [30, 70],
                fga: [60, 140],
                fgp: [35, 50],
                tp: [0, 15],
                tpa: [0, 30],
                tpp: [20, 50],
                ft: [5, 25],
                fta: [10, 30],
                ftp: [60, 90],
                orb: [0, 30],
                drb: [20, 60],
                trb: [30, 90],
                ast: [15, 40],
                tov: [5, 20],
                stl: [0, 15],
                blk: [0, 15],
                pf: [5, 25],
                pts: [80, 130],
                oppPts: [80, 130]
            };

            for (stat in vm.statsAll) {
                if (vm.statsAll.hasOwnProperty(stat)) {
                    boxPlot.create({
                        data: vm.statsAll[stat](),
                        scale: scale[stat],
                        container: stat + "BoxPlot"
                    });

                    if (nbaStatsAll.hasOwnProperty(stat)) {
                        boxPlot.create({
                            data: nbaStatsAll[stat],
                            scale: scale[stat],
                            container: stat + "BoxPlotNba",
                            color: "#0088cc",
                            labels: false
                        });
                    }
                }
            }
        }).extend({throttle: 1});
    }

    function uiEvery(updateEvents, vm) {
        components.dropdown("team-stat-dists-dropdown", ["seasons"], [vm.season()], updateEvents);
    }

    return bbgmView.init({
        id: "teamStatDists",
        get: get,
        InitViewModel: InitViewModel,
        runBefore: [updateTeams],
        uiFirst: uiFirst,
        uiEvery: uiEvery
    });
});