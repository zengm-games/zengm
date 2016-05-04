var g = require('../globals');
var ui = require('../ui');
var player = require('../core/player');
var boxPlot = require('../lib/boxPlot');
var $ = require('jquery');
var ko = require('knockout');
var _ = require('underscore');
var components = require('./components');
var bbgmView = require('../util/bbgmView');
var helpers = require('../util/helpers');

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
        return g.dbl.players.getAll().then(function (players) {
            return player.withStats(null, players, {statsSeasons: [inputs.season]});
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

module.exports = bbgmView.init({
    id: "playerRatingDists",
    get,
    InitViewModel,
    runBefore: [updatePlayers],
    uiFirst,
    uiEvery
});
