/**
 * @name views.careerStats
 * @namespace Career stats table.
 */
define(["globals", "ui", "core/player", "lib/jquery", "lib/knockout", "lib/underscore", "views/components", "util/bbgmView", "util/helpers", "util/viewHelpers"], function (g, ui, player, $, ko, _, components, bbgmView, helpers, viewHelpers) {
    "use strict";

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
        var deferred;

        if (updateEvents.indexOf("firstRun") >= 0 || updateEvents.indexOf("dbChange") >= 0 || updateEvents.indexOf("gameSim") >= 0 || updateEvents.indexOf("playerMovement") >= 0) {
            deferred = $.Deferred();

            g.dbl.transaction("players").objectStore("players").getAll().onsuccess = function (event) {
                var i, players;

                players = player.filter(event.target.result, {
                    attrs: ["pid", "name", "pos", "age"],
                    stats: ["abbrev", "gp", "gs", "min", "fg", "fga", "fgp", "tp", "tpa", "tpp", "ft", "fta", "ftp", "orb", "drb", "trb", "ast", "tov", "stl", "blk", "pf", "pts", "per", "ewa"]
                });

                for (i = 0; i < players.length; i++) {
                    delete players[i].ratings;
                    delete players[i].stats;
                }

                deferred.resolve({
                    players: players
                });
            };
            return deferred.promise();
        }
    }

    function uiFirst(vm) {
        ui.title("Career Stats");

        ko.computed(function () {
            var season;
            season = vm.season();
            ui.datatable($("#career-stats"), 2, _.map(vm.players(), function (p) {
                return [helpers.playerNameLabels(p.pid, p.name), p.pos, String(p.careerStats.gp), String(p.careerStats.gs), helpers.round(p.careerStats.min, 1), helpers.round(p.careerStats.fg, 1), helpers.round(p.careerStats.fga, 1), helpers.round(p.careerStats.fgp, 1), helpers.round(p.careerStats.tp, 1), helpers.round(p.careerStats.tpa, 1), helpers.round(p.careerStats.tpp, 1), helpers.round(p.careerStats.ft, 1), helpers.round(p.careerStats.fta, 1), helpers.round(p.careerStats.ftp, 1), helpers.round(p.careerStats.orb, 1), helpers.round(p.careerStats.drb, 1), helpers.round(p.careerStats.trb, 1), helpers.round(p.careerStats.ast, 1), helpers.round(p.careerStats.tov, 1), helpers.round(p.careerStats.stl, 1), helpers.round(p.careerStats.blk, 1), helpers.round(p.careerStats.pf, 1), helpers.round(p.careerStats.pts, 1), helpers.round(p.careerStats.per, 1), helpers.round(p.careerStats.ewa, 1)];
            }));
        }).extend({throttle: 1});

        ui.tableClickableRows($("#career-stats"));
    }

    return bbgmView.init({
        id: "careerStats",
        get: get,
        InitViewModel: InitViewModel,
        mapping: mapping,
        runBefore: [updatePlayers],
        uiFirst: uiFirst
    });
});