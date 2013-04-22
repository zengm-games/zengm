/**
 * @name views.playerRatingDists
 * @namespace Player rating distributions.
 */
define(["db", "globals", "ui", "lib/boxPlot", "lib/jquery", "lib/knockout", "lib/underscore", "views/components", "util/bbgmView", "util/helpers", "util/viewHelpers"], function (db, g, ui, boxPlot, $, ko, _, components, bbgmView, helpers, viewHelpers) {
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
        var deferred, vars;

        if ((inputs.season === g.season && (updateEvents.indexOf("gameSim") >= 0 || updateEvents.indexOf("playerMovement") >= 0)) || inputs.season !== vm.season()) {
            deferred = $.Deferred();
            vars = {};

            g.dbl.transaction(["players"]).objectStore("players").getAll().onsuccess = function (event) {
                var attributes, data, players, ratings, ratingsAll, stats;

                attributes = [];
                ratings = ["ovr", "pot", "hgt", "stre", "spd", "jmp", "endu", "ins", "dnk", "ft", "fg", "tp", "blk", "stl", "drb", "pss", "reb"];
                stats = [];
                players = db.getPlayers(event.target.result, inputs.season, null, attributes, stats, ratings, {fuzz: true});

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

                vars = {
                    season: inputs.season,
                    ratingsAll: ratingsAll
                };

                deferred.resolve(vars);
            };
            return deferred.promise();
        }
    }

    function uiEvery(updateEvents, vm) {
        var scale, season, rating, tbody;

        season = vm.season();

        ui.title("Player Rating Distributions - " + season);

        components.dropdown("player-rating-dists-dropdown", ["seasons"], [season], updateEvents);

        tbody = $("#player-rating-dists tbody");

        for (rating in vm.ratingsAll) {
            if (vm.ratingsAll.hasOwnProperty(rating)) {
                tbody.append('<tr><td style="text-align: right; padding-right: 1em;">' + rating + '</td><td width="100%"><div id="' + rating + 'BoxPlot"></div></td></tr>');

                boxPlot.create({
                    data: vm.ratingsAll[rating](),
                    scale: [0, 100],
                    container: rating + "BoxPlot"
                });
            }
        }
    }

    return bbgmView.init({
        id: "playerRatingDists",
        get: get,
        InitViewModel: InitViewModel,
        runBefore: [updatePlayers],
        uiEvery: uiEvery
    });
});