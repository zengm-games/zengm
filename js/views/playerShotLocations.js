var g = require('../globals');
var ui = require('../ui');
var player = require('../core/player');
var backboard = require('backboard');
var $ = require('jquery');
var ko = require('knockout');
var _ = require('underscore');
var components = require('./components');
var bbgmView = require('../util/bbgmView');
var helpers = require('../util/helpers');

var mapping;

function get(req) {
    return {
        season: helpers.validateSeason(req.params.season)
    };
}

function InitViewModel() {
    this.season = ko.observable();
}

mapping = {
    players: {
        create: function (options) {
            return options.data;
        }
    }
};

function updatePlayers(inputs, updateEvents, vm) {
    if (updateEvents.indexOf("dbChange") >= 0 || (inputs.season === g.season && (updateEvents.indexOf("gameSim") >= 0 || updateEvents.indexOf("playerMovement") >= 0)) || inputs.season !== vm.season()) {
        return g.dbl.players.index('tid').getAll(backboard.lowerBound(g.PLAYER.RETIRED)).then(function (players) {
            return player.withStats(null, players, {statsSeasons: [inputs.season]});
        }).then(function (players) {
            players = player.filter(players, {
                attrs: ["pid", "name", "age", "injury", "watch"],
                ratings: ["skills", "pos"],
                stats: ["abbrev", "gp", "gs", "min", "fgAtRim", "fgaAtRim", "fgpAtRim", "fgLowPost", "fgaLowPost", "fgpLowPost", "fgMidRange", "fgaMidRange", "fgpMidRange", "tp", "tpa", "tpp"],
                season: inputs.season
            });

            return {
                season: inputs.season,
                players: players
            };
        });
    }
}

function uiFirst(vm) {
    ko.computed(function () {
        ui.title("Player Shot Locations - " + vm.season());
    }).extend({throttle: 1});

    ko.computed(function () {
        var season;
        season = vm.season();
        ui.datatable($("#player-shot-locations"), 0, _.map(vm.players(), function (p) {
            return [helpers.playerNameLabels(p.pid, p.name, p.injury, p.ratings.skills, p.watch), p.ratings.pos, '<a href="' + helpers.leagueUrl(["roster", p.stats.abbrev, season]) + '">' + p.stats.abbrev + '</a>', String(p.stats.gp), String(p.stats.gs), helpers.round(p.stats.min, 1), helpers.round(p.stats.fgAtRim, 1), helpers.round(p.stats.fgaAtRim, 1), helpers.round(p.stats.fgpAtRim, 1), helpers.round(p.stats.fgLowPost, 1), helpers.round(p.stats.fgaLowPost, 1), helpers.round(p.stats.fgpLowPost, 1), helpers.round(p.stats.fgMidRange, 1), helpers.round(p.stats.fgaMidRange, 1), helpers.round(p.stats.fgpMidRange, 1), helpers.round(p.stats.tp, 1), helpers.round(p.stats.tpa, 1), helpers.round(p.stats.tpp, 1)];
        }));
    }).extend({throttle: 1});

    ui.tableClickableRows($("#player-shot-locations"));
}

function uiEvery(updateEvents, vm) {
    components.dropdown("player-shot-locations-dropdown", ["seasons"], [vm.season()], updateEvents);
}

module.exports = bbgmView.init({
    id: "playerShotLocations",
    get: get,
    InitViewModel: InitViewModel,
    mapping: mapping,
    runBefore: [updatePlayers],
    uiFirst: uiFirst,
    uiEvery: uiEvery
});
