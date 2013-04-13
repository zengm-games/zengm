/**
 * @name views.teamStats
 * @namespace Team stats table.
 */
define(["db", "globals", "ui", "lib/jquery", "lib/knockout", "lib/underscore", "views/components", "util/helpers", "util/viewHelpers"], function (db, g, ui, $, ko, _, components, helpers, viewHelpers) {
    "use strict";

    var teams, vm;

    function display(updateEvents, cb) {
        var leagueContentEl, season;

        season = vm.season();

        leagueContentEl = document.getElementById("league_content");
        if (leagueContentEl.dataset.id !== "teamStats") {
            ui.update({
                container: "league_content",
                template: "teamStats"
            });
            ko.applyBindings(vm, leagueContentEl);
        }
        ui.title("Team Stats - " + season);

        components.dropdown("team-stats-dropdown", ["seasons"], [season], updateEvents);

        ui.datatableSinglePage($("#team-stats"), 2, _.map(teams, function (t) {
            return ['<a href="/l/' + g.lid + '/roster/' + t.abbrev + '">' + t.abbrev + '</a>', String(t.gp), String(t.won), String(t.lost), helpers.round(t.fg, 1), helpers.round(t.fga, 1), helpers.round(t.fgp, 1), helpers.round(t.tp, 1), helpers.round(t.tpa, 1), helpers.round(t.tpp, 1), helpers.round(t.ft, 1), helpers.round(t.fta, 1), helpers.round(t.ftp, 1), helpers.round(t.orb, 1), helpers.round(t.drb, 1), helpers.round(t.trb, 1), helpers.round(t.ast, 1), helpers.round(t.tov, 1), helpers.round(t.stl, 1), helpers.round(t.blk, 1), helpers.round(t.pf, 1), helpers.round(t.pts, 1), helpers.round(t.oppPts, 1)];
        }));

        cb();
    }

    function loadBefore(season, cb) {
        var attributes, seasonAttributes, stats;

        attributes = ["abbrev"];
        stats = ["gp", "fg", "fga", "fgp", "tp", "tpa", "tpp", "ft", "fta", "ftp", "orb", "drb", "trb", "ast", "tov", "stl", "blk", "pf", "pts", "oppPts"];
        seasonAttributes = ["won", "lost"];
        db.getTeams(null, season, attributes, stats, seasonAttributes, {}, function (ts) {
            teams = ts;

            vm.season(season);

            cb();
        });
    }

    function update(season, updateEvents, cb) {
        var leagueContentEl;

        leagueContentEl = document.getElementById("league_content");
        if (leagueContentEl.dataset.id !== "teamStats") {
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