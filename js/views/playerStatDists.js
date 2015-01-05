/**
 * @name views.playerStatDists
 * @namespace Player stat distributions.
 */
define(["dao", "globals", "ui", "core/player", "lib/boxPlot", "lib/jquery", "lib/knockout", "lib/underscore", "views/components", "util/bbgmView", "util/helpers"], function (dao, g, ui, player, boxPlot, $, ko, _, components, bbgmView, helpers) {
    "use strict";

    var nbaQuartiles;

    nbaQuartiles = {
        gp: [1, 25, 52, 74, 82],
        min: [0, 11.4857142857, 20.3759398496, 28.6286673736, 41.359375],
        fg: [0, 1.2676056338, 2.6043478261, 4.2253994954, 10.1052631579],
        fga: [0, 2.976744186, 6, 9.144963145, 21.96875],
        fgp: [0, 39.6551724138, 44.2206477733, 48.7304827389, 100],
        tp: [0, 0, 0.25, 0.9499921863, 3],
        tpa: [0, 0.0545454545, 0.9326923077, 2.7269647696, 7.064516129],
        tpp: [0, 0, 28.5714285714, 35.7142857143, 100],
        ft: [0, 0.5, 1.069047619, 2.0634920635, 9.2195121951],
        fta: [0, 0.7464788732, 1.5282193959, 2.8446447508, 10.243902439],
        ftp: [0, 63.6363636364, 74.184204932, 81.4814814815, 100],
        orb: [0, 0.3333333333, 0.6938888889, 1.3094934014, 4.4285714286],
        drb: [0, 1.2272727273, 2.0930735931, 3.2760889292, 9.7317073171],
        trb: [0, 1.625, 2.8438363737, 4.5811403509, 13.1951219512],
        ast: [0, 0.5438596491, 1.1645833333, 2.3024060646, 11.012345679],
        tov: [0, 0.5769230769, 0.9638501742, 1.5492063492, 3.796875],
        stl: [0, 0.2985074627, 0.5330668605, 0.8278070175, 2.3333333333],
        blk: [0, 0.1111111111, 0.23875, 0.5, 2.7804878049],
        pf: [0, 1.2307692308, 1.828536436, 2.4295634921, 4],
        pts: [0, 3.3333333333, 7.0507246377, 11.2698735321, 30.1463414634]
    };

    function get(req) {
        return {
            season: helpers.validateSeason(req.params.season)
        };
    }

    function InitViewModel() {
        this.season = ko.observable();
    }

    function updatePlayers(inputs, updateEvents, vm) {
        if (updateEvents.indexOf("dbChange") >= 0 || (inputs.season === g.season && (updateEvents.indexOf("gameSim") >= 0 || updateEvents.indexOf("playerMovement") >= 0)) || inputs.season !== vm.season()) {
            return dao.players.getAll({
                index: "tid",
                key: IDBKeyRange.lowerBound(g.PLAYER.RETIRED),
                statsSeasons: [inputs.season]
            }).then(function (players) {
                var statsAll;

                players = player.filter(players, {
                    attrs: ["pid", "name", "pos", "age", "injury"],
                    ratings: ["skills"],
                    stats: ["gp", "gs", "min", "fg", "fga", "fgp", "tp", "tpa", "tpp", "ft", "fta", "ftp", "orb", "drb", "trb", "ast", "tov", "stl", "blk", "pf", "pts", "per"],
                    season: inputs.season
                });

                statsAll = _.reduce(players, function (memo, player) {
                    var stat;
                    for (stat in player.stats) {
                        if (player.stats.hasOwnProperty(stat)) {
                            if (memo.hasOwnProperty(stat)) {
                                memo[stat].push(player.stats[stat]);
                            } else {
                                memo[stat] = [player.stats[stat]];
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
            ui.title("Player Stat Distributions - " + vm.season());
        }).extend({throttle: 1});

        tbody = $("#player-stat-dists tbody");

        for (stat in vm.statsAll) {
            if (vm.statsAll.hasOwnProperty(stat)) {
                tbody.append('<tr><td style="text-align: right; padding-right: 1em;">' + stat + '</td><td width="100%"><div id="' + stat + 'BoxPlot"></div></td></tr>');
                if (nbaQuartiles.hasOwnProperty(stat)) {
                    tbody.append('<tr><td></td><td width="100%"><div id="' + stat + 'BoxPlotNba" style="margin-top: -26px"></div></td></tr>');
                }
            }
        }

        ko.computed(function () {
            var scale, stat;

            // Scales for the box plots. This is not done dynamically so that the plots will be comparable across seasons.
            scale = {
                gp: [0, 82],
                gs: [0, 82],
                min: [0, 50],
                fg: [0, 20],
                fga: [0, 40],
                fgp: [0, 100],
                tp: [0, 5],
                tpa: [0, 10],
                tpp: [0, 100],
                ft: [0, 15],
                fta: [0, 25],
                ftp: [0, 100],
                orb: [0, 10],
                drb: [0, 15],
                trb: [0, 25],
                ast: [0, 15],
                tov: [0, 10],
                stl: [0, 5],
                blk: [0, 5],
                pf: [0, 6],
                pts: [0, 50],
                per: [0, 35]
            };

            for (stat in vm.statsAll) {
                if (vm.statsAll.hasOwnProperty(stat)) {
                    boxPlot.create({
                        data: vm.statsAll[stat](),
                        scale: scale[stat],
                        container: stat + "BoxPlot"
                    });

                    if (nbaQuartiles.hasOwnProperty(stat)) {
                        boxPlot.create({
                            quartiles: nbaQuartiles[stat],
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
        components.dropdown("player-stat-dists-dropdown", ["seasons"], [vm.season()], updateEvents);
    }

    return bbgmView.init({
        id: "playerStatDists",
        get: get,
        InitViewModel: InitViewModel,
        runBefore: [updatePlayers],
        uiFirst: uiFirst,
        uiEvery: uiEvery
    });
});