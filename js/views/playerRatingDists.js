/**
 * @name views.playerRatingDists
 * @namespace Player rating distributions.
 */
define(["dao", "globals", "ui", "core/player", "lib/boxPlot", "lib/jquery", "lib/knockout", "lib/underscore", "views/components", "util/bbgmView", "util/helpers"], function (dao, g, ui, player, boxPlot, $, ko, _, components, bbgmView, helpers) {
    "use strict";

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
                statsSeasons: [inputs.season]
            }).then(function (players) {
                var ratingsAll;

                players = player.filter(players, {
                    ratings: ["ovr", "pot", "hgt", "stre", "spd", "jmp", "endu", "ins", "dnk", "ft", "fg", "tp", "blk", "stl", "drb", "pss", "reb"],
                    season: inputs.season,
                    showNoStats: true,
                    showRookies: true,
                    fuzz: true
                });

                ratingsAll = _.reduce(players, function (memo, player) {
                    var rating;
                    for (rating in player.ratings) {
                        if (player.ratings.hasOwnProperty(rating)) {
                            if (memo.hasOwnProperty(rating)) {
                                memo[rating].push(player.ratings[rating]);
                            } else {
                                memo[rating] = [player.ratings[rating]];
                            }
                        }
                    }
                    return memo;
                }, {});

                return {
                    season: inputs.season,
                    ratingsAll: ratingsAll
                };
            });
        }
    }

    function uiFirst(vm) {
        var rating, tbody;

        ko.computed(function () {
            ui.title("Player Rating Distributions - " + vm.season());
        }).extend({throttle: 1});


        tbody = $("#player-rating-dists tbody");

        for (rating in vm.ratingsAll) {
            if (vm.ratingsAll.hasOwnProperty(rating)) {
                tbody.append('<tr><td style="text-align: right; padding-right: 1em;">' + rating + '</td><td width="100%"><div id="' + rating + 'BoxPlot"></div></td></tr>');
            }
        }

        ko.computed(function () {
            var rating;

            for (rating in vm.ratingsAll) {
                if (vm.ratingsAll.hasOwnProperty(rating)) {
                    boxPlot.create({
                        data: vm.ratingsAll[rating](),
                        scale: [0, 100],
                        container: rating + "BoxPlot"
                    });
                }
            }
        }).extend({throttle: 1});
    }

    function uiEvery(updateEvents, vm) {
        components.dropdown("player-rating-dists-dropdown", ["seasons"], [vm.season()], updateEvents);
    }

    return bbgmView.init({
        id: "playerRatingDists",
        get: get,
        InitViewModel: InitViewModel,
        runBefore: [updatePlayers],
        uiFirst: uiFirst,
        uiEvery: uiEvery
    });
});