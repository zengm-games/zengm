/**
 * @name views.playerStats
 * @namespace Player stats table.
 */
define(["db", "globals", "ui", "lib/jquery", "lib/knockout", "lib/underscore", "views/components", "util/helpers", "util/viewHelpers"], function (db, g, ui, $, ko, _, components, helpers, viewHelpers) {
    "use strict";

    var players, vm;

    function display(updateEvents, cb) {
        var season;

        season = vm.season();

        if (document.getElementById("league_content").dataset.id !== "playerStats") {
            ui.update({
                container: "league_content",
                template: "playerStats"
            });
            ko.applyBindings(vm, document.getElementById("league_content"));
        }
        ui.title("Player Stats - " + season);

        components.dropdown("player-stats-dropdown", ["seasons"], [season], updateEvents);

        ui.datatable($("#player-stats"), 2, _.map(players, function (p) {
            return [helpers.playerNameLabels(p.pid, p.name, p.injury, p.ratings.skills), p.pos, '<a href="/l/' + g.lid + '/roster/' + p.stats.abbrev + '/' + season + '">' + p.stats.abbrev + '</a>', String(p.stats.gp), String(p.stats.gs), helpers.round(p.stats.min, 1), helpers.round(p.stats.fg, 1), helpers.round(p.stats.fga, 1), helpers.round(p.stats.fgp, 1), helpers.round(p.stats.tp, 1), helpers.round(p.stats.tpa, 1), helpers.round(p.stats.tpp, 1), helpers.round(p.stats.ft, 1), helpers.round(p.stats.fta, 1), helpers.round(p.stats.ftp, 1), helpers.round(p.stats.orb, 1), helpers.round(p.stats.drb, 1), helpers.round(p.stats.trb, 1), helpers.round(p.stats.ast, 1), helpers.round(p.stats.tov, 1), helpers.round(p.stats.stl, 1), helpers.round(p.stats.blk, 1), helpers.round(p.stats.pf, 1), helpers.round(p.stats.pts, 1), helpers.round(p.stats.per, 1)];
        }));

        cb();
    }

    function loadBefore(season, cb) {
        g.dbl.transaction(["players"]).objectStore("players").getAll().onsuccess = function (event) {
            var attributes, ratings, stats;

            attributes = ["pid", "name", "pos", "age", "injury"];
            ratings = ["skills"];
            stats = ["abbrev", "gp", "gs", "min", "fg", "fga", "fgp", "tp", "tpa", "tpp", "ft", "fta", "ftp", "orb", "drb", "trb", "ast", "tov", "stl", "blk", "pf", "pts", "per"];
            players = db.getPlayers(event.target.result, season, null, attributes, stats, ratings, {showRookies: true});

            vm.season(season);

            cb();
        };
    }

    function update(season, updateEvents, cb) {
        var leagueContentEl;

        leagueContentEl = document.getElementById("league_content");
        if (leagueContentEl.dataset.id !== "playerStats") {
            ko.cleanNode(leagueContentEl);
            vm = {
                season: ko.observable()
            };
        }

        if ((season === g.season && (updateEvents.indexOf("gameSim") >= 0 || updateEvents.indexOf("playerMovement") >= 0)) || season !== vm.season()) {
            loadBefore(season, function () {
                display(updateEvents, cb);
            });
        } else {
            display(updateEvents, cb);
        }


    }

    function get(req) {
        viewHelpers.beforeLeague(req, function (updateEvents, cb) {
            var season;

            season = helpers.validateSeason(req.params.season);

            update(season, updateEvents, cb);
        });
    }

    return {
        update: update,
        get: get
    };
});