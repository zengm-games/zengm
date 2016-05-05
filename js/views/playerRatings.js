const g = require('../globals');
const ui = require('../ui');
const player = require('../core/player');
const $ = require('jquery');
const ko = require('knockout');
const _ = require('underscore');
const components = require('./components');
const bbgmView = require('../util/bbgmView');
const helpers = require('../util/helpers');


function get(req) {
    var abbrev;

    if (g.teamAbbrevsCache.indexOf(req.params.abbrev) >= 0) {
        abbrev = req.params.abbrev;
    } else if (req.params.abbrev && req.params.abbrev === 'watch') {
        abbrev = "watch";
    } else {
        abbrev = "all";
    }

    return {
        abbrev: abbrev,
        season: helpers.validateSeason(req.params.season)
    };
}

function InitViewModel() {
    this.abbrev = ko.observable();
    this.season = ko.observable();
}

const mapping = {
    players: {
        create: options => options.data
    }
};

function updatePlayers(inputs, updateEvents, vm) {
    if (updateEvents.indexOf("dbChange") >= 0 || (inputs.season === g.season && updateEvents.indexOf("playerMovement") >= 0) || (updateEvents.indexOf("newPhase") >= 0 && g.phase === g.PHASE.PRESEASON) || inputs.season !== vm.season() || inputs.abbrev !== vm.abbrev()) {
        return g.dbl.players.getAll().then(function (players) {
            return player.withStats(null, players, {
                statsSeasons: [inputs.season]
            });
        }).then(function (players) {
            var i, tid;

            tid = g.teamAbbrevsCache.indexOf(inputs.abbrev);
            if (tid < 0) { tid = null; } // Show all teams

            if (!tid && inputs.abbrev === "watch") {
                players = players.filter(function (p) {
                    return p.watch && typeof p.watch !== "function";
                });
            }

            players = player.filter(players, {
                attrs: ["pid", "name", "abbrev", "age", "injury", "watch"],
                ratings: ["ovr", "pot", "hgt", "stre", "spd", "jmp", "endu", "ins", "dnk", "ft", "fg", "tp", "blk", "stl", "drb", "pss", "reb", "skills", "pos"],
                stats: ["abbrev"],
                season: inputs.season,
                showNoStats: true, // If this is true, it makes the "tid" entry do nothing
                showRookies: true,
                fuzz: true
            });

            // player.filter TID option doesn't work well enough (factoring in showNoStats and showRookies), so let's do it manually
            // For the current season, use the current abbrev (including FA), not the last stats abbrev
            // For other seasons, use the stats abbrev for filtering
            if (g.season === inputs.season) {
                if (tid !== null) {
                    players = players.filter(function (p) { return p.abbrev === inputs.abbrev; });
                }

                for (i = 0; i < players.length; i++) {
                    players[i].stats.abbrev = players[i].abbrev;
                }
            } else {
                if (tid !== null) {
                    players = players.filter(function (p) { return p.stats.abbrev === inputs.abbrev; });
                }
            }

            return {
                abbrev: inputs.abbrev,
                season: inputs.season,
                players: players
            };
        });
    }
}

function uiFirst(vm) {
    ko.computed(function () {
        ui.title("Player Ratings - " + vm.season());
    }).extend({throttle: 1});

    ko.computed(function () {
        var season;
        season = vm.season();
        ui.datatable($("#player-ratings"), 4, _.map(vm.players(), function (p) {
            return [helpers.playerNameLabels(p.pid, p.name, p.injury, p.ratings.skills, p.watch), p.ratings.pos, '<a href="' + helpers.leagueUrl(["roster", p.stats.abbrev, season]) + '">' + p.stats.abbrev + '</a>', String(p.age - (g.season - season)), String(p.ratings.ovr), String(p.ratings.pot), String(p.ratings.hgt), String(p.ratings.stre), String(p.ratings.spd), String(p.ratings.jmp), String(p.ratings.endu), String(p.ratings.ins), String(p.ratings.dnk), String(p.ratings.ft), String(p.ratings.fg), String(p.ratings.tp), String(p.ratings.blk), String(p.ratings.stl), String(p.ratings.drb), String(p.ratings.pss), String(p.ratings.reb)];
        }));
    }).extend({throttle: 1});

    ui.tableClickableRows($("#player-ratings"));
}

function uiEvery(updateEvents, vm) {
    components.dropdown("player-ratings-dropdown", ["teamsAndAllWatch", "seasons"], [vm.abbrev(), vm.season()], updateEvents);
}

module.exports = bbgmView.init({
    id: "playerRatings",
    get,
    InitViewModel,
    mapping,
    runBefore: [updatePlayers],
    uiFirst,
    uiEvery
});

