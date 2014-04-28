/**
 * @name views.playerRatings
 * @namespace Player ratings table.
 */
define(["globals", "ui", "core/player", "lib/jquery", "lib/knockout", "lib/underscore", "views/components", "util/bbgmView", "util/helpers", "util/viewHelpers"], function (g, ui, player, $, ko, _, components, bbgmView, helpers, viewHelpers) {
    "use strict";

    var mapping;

    function get(req) {
        var abbrev;

        if (g.teamAbbrevsCache.indexOf(req.params.abbrev) >= 0) {
            abbrev = req.params.abbrev;
        } else {
            abbrev = "all";
        }

        return {
            season: helpers.validateSeason(req.params.season),
            abbrev: abbrev
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
        var deferred;

        if (updateEvents.indexOf("dbChange") >= 0 || (inputs.season === g.season && updateEvents.indexOf("playerMovement") >= 0) || (updateEvents.indexOf("newPhase") >= 0 && g.phase === g.PHASE.PRESEASON) || inputs.season !== vm.season() || inputs.abbrev !== vm.abbrev()) {
            deferred = $.Deferred();

            g.dbl.transaction(["players"]).objectStore("players").index("tid").getAll(IDBKeyRange.lowerBound(g.PLAYER.RETIRED)).onsuccess = function (event) {
                var i, players, tid;

                tid = g.teamAbbrevsCache.indexOf(inputs.abbrev);
                if (tid < 0) { tid = null; } // Show all teams

                players = player.filter(event.target.result, {
                    attrs: ["pid", "name", "abbrev", "pos", "age", "injury", "watch"],
                    ratings: ["ovr", "pot", "hgt", "stre", "spd", "jmp", "endu", "ins", "dnk", "ft", "fg", "tp", "blk", "stl", "drb", "pss", "reb", "skills"],
                    stats: ["abbrev"],
                    season: inputs.season,
                    showNoStats: true, // If this is true, it makes the "tid" entry do nothing
                    showRookies: true,
                    fuzz: true
                });

                // player.filter TID option doesn't work well enough (factoring in showNoStats and showRookies), so let's do it manually
                if (tid !== null) {
                    players = players.filter(function (p) { return p.abbrev === inputs.abbrev; });
                }

                // For the current season, use the current abbrev (including FA), not the last stats abbrev
                if (g.season === inputs.season) {
                    for (i = 0; i < players.length; i++) {
                        players[i].stats.abbrev = players[i].abbrev;
                    }
                }

                deferred.resolve({
                    abbrev: inputs.abbrev,
                    season: inputs.season,
                    players: players
                });
            };
            return deferred.promise();
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
                return [helpers.playerNameLabels(p.pid, p.name, p.injury, p.ratings.skills, p.watch), p.pos, '<a href="' + helpers.leagueUrl(["roster", p.stats.abbrev, season]) + '">' + p.stats.abbrev + '</a>', String(p.age - (g.season - season)), String(p.ratings.ovr), String(p.ratings.pot), String(p.ratings.hgt), String(p.ratings.stre), String(p.ratings.spd), String(p.ratings.jmp), String(p.ratings.endu), String(p.ratings.ins), String(p.ratings.dnk), String(p.ratings.ft), String(p.ratings.fg), String(p.ratings.tp), String(p.ratings.blk), String(p.ratings.stl), String(p.ratings.drb), String(p.ratings.pss), String(p.ratings.reb)];
            }));
        }).extend({throttle: 1});

        ui.tableClickableRows($("#player-ratings"));
    }

    function uiEvery(updateEvents, vm) {
        components.dropdown("player-ratings-dropdown", ["teamsAndAll", "seasons"], [vm.abbrev(), vm.season()], updateEvents);
    }

    return bbgmView.init({
        id: "playerRatings",
        get: get,
        InitViewModel: InitViewModel,
        mapping: mapping,
        runBefore: [updatePlayers],
        uiFirst: uiFirst,
        uiEvery: uiEvery
    });
});