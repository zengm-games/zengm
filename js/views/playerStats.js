/**
 * @name views.playerStats
 * @namespace Player stats table.
 */
define(["db", "globals", "ui", "lib/jquery", "lib/knockout", "lib/underscore", "views/components", "util/bbgmView", "util/helpers", "util/viewHelpers"], function (db, g, ui, $, ko, _, components, bbgmView, helpers, viewHelpers) {
    "use strict";

    var mapping;

    function get(req) {
        return {
            season: helpers.validateSeason(req.params.season)
        };
    }

    function InitViewModel() {
        this.season = ko.observable();
        this.players = [];
    }

    mapping = {
        players: {
            create: function (options) {
                return options.data;
            }
        }
    };

    function updatePlayerStats(inputs, updateEvents, vm) {
        var deferred, vars;

        if ((inputs.season === g.season && (updateEvents.indexOf("gameSim") >= 0 || updateEvents.indexOf("playerMovement") >= 0)) || inputs.season !== vm.season()) {
            deferred = $.Deferred();
            vars = {};

            g.dbl.transaction(["players"]).objectStore("players").getAll().onsuccess = function (event) {
                var attributes, players, ratings, stats;

                attributes = ["pid", "name", "pos", "age", "injury"];
                ratings = ["skills"];
                stats = ["abbrev", "gp", "gs", "min", "fg", "fga", "fgp", "tp", "tpa", "tpp", "ft", "fta", "ftp", "orb", "drb", "trb", "ast", "tov", "stl", "blk", "pf", "pts", "per"];
                players = db.getPlayers(event.target.result, inputs.season, null, attributes, stats, ratings, {showRookies: true});

                vars = {
                    season: inputs.season,
                    players: players
                };

                deferred.resolve(vars);
            };
            return deferred.promise();
        }
    }

    function uiEvery(updateEvents, vm) {
        var season;

        season = vm.season();

        ui.title("Player Stats - " + season);

        components.dropdown("player-stats-dropdown", ["seasons"], [season], updateEvents);

        ui.datatable($("#player-stats"), 2, _.map(vm.players, function (p) {
            return [helpers.playerNameLabels(p.pid, p.name, p.injury, p.ratings.skills), p.pos, '<a href="/l/' + g.lid + '/roster/' + p.stats.abbrev + '/' + season + '">' + p.stats.abbrev + '</a>', String(p.stats.gp), String(p.stats.gs), helpers.round(p.stats.min, 1), helpers.round(p.stats.fg, 1), helpers.round(p.stats.fga, 1), helpers.round(p.stats.fgp, 1), helpers.round(p.stats.tp, 1), helpers.round(p.stats.tpa, 1), helpers.round(p.stats.tpp, 1), helpers.round(p.stats.ft, 1), helpers.round(p.stats.fta, 1), helpers.round(p.stats.ftp, 1), helpers.round(p.stats.orb, 1), helpers.round(p.stats.drb, 1), helpers.round(p.stats.trb, 1), helpers.round(p.stats.ast, 1), helpers.round(p.stats.tov, 1), helpers.round(p.stats.stl, 1), helpers.round(p.stats.blk, 1), helpers.round(p.stats.pf, 1), helpers.round(p.stats.pts, 1), helpers.round(p.stats.per, 1)];
        }));
    }

    return bbgmView.init({
        id: "playerStats",
        get: get,
        InitViewModel: InitViewModel,
        mapping: mapping,
        runBefore: [updatePlayerStats],
        uiEvery: uiEvery
    });
});