/**
 * @name views.teamShotLocations
 * @namespace Team shot locations table.
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
        this.teams = [];
    }

    mapping = {
        teams: {
            create: function (options) {
                return options.data;
            }
        }
    };

    function updateTeams(inputs, updateEvents, vm) {
        var attributes, deferred, seasonAttributes, stats, vars;

        if ((inputs.season === g.season && (updateEvents.indexOf("gameSim") >= 0 || updateEvents.indexOf("playerMovement") >= 0)) || inputs.season !== vm.season()) {
            deferred = $.Deferred();
            vars = {};

            attributes = ["abbrev"];
            stats = ["gp", "fgAtRim", "fgaAtRim", "fgpAtRim", "fgLowPost", "fgaLowPost", "fgpLowPost", "fgMidRange", "fgaMidRange", "fgpMidRange", "tp", "tpa", "tpp"];
            seasonAttributes = ["won", "lost"];
            db.getTeams(null, inputs.season, attributes, stats, seasonAttributes, {}, function (teams) {
                vars = {
                    season: inputs.season,
                    teams: teams
                };

                deferred.resolve(vars);
            });
            return deferred.promise();
        }
    }

    function uiEvery(updateEvents, vm) {
        var season;

        season = vm.season();

        ui.title("Team Shot Locations - " + season);

        components.dropdown("team-shot-locations-dropdown", ["seasons"], [season], updateEvents);

        ui.datatableSinglePage($("#team-shot-locations"), 2, _.map(vm.teams, function (t) {
            return ['<a href="/l/' + g.lid + '/roster/' + t.abbrev + '">' + t.abbrev + '</a>', String(t.gp), String(t.won), String(t.lost), helpers.round(t.fgAtRim, 1), helpers.round(t.fgaAtRim, 1), helpers.round(t.fgpAtRim, 1), helpers.round(t.fgLowPost, 1), helpers.round(t.fgaLowPost, 1), helpers.round(t.fgpLowPost, 1), helpers.round(t.fgMidRange, 1), helpers.round(t.fgaMidRange, 1), helpers.round(t.fgpMidRange, 1), helpers.round(t.tp, 1), helpers.round(t.tpa, 1), helpers.round(t.tpp, 1)];
        }));
    }

    return bbgmView.init({
        id: "teamShotLocations",
        get: get,
        InitViewModel: InitViewModel,
        mapping: mapping,
        runBefore: [updateTeams],
        uiEvery: uiEvery
    });
});