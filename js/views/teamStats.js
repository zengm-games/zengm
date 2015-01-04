/**
 * @name views.teamStats
 * @namespace Team stats table.
 */
define(["globals", "ui", "core/team", "lib/jquery", "lib/knockout", "lib/underscore", "views/components", "util/bbgmView", "util/helpers"], function (g, ui, team, $, ko, _, components, bbgmView, helpers) {
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
        teams: {
            create: function (options) {
                return options.data;
            }
        }
    };

    function updateTeams(inputs, updateEvents, vm) {
        if (updateEvents.indexOf("dbChange") >= 0 || (inputs.season === g.season && (updateEvents.indexOf("gameSim") >= 0 || updateEvents.indexOf("playerMovement") >= 0)) || inputs.season !== vm.season()) {
            return team.filter({
                attrs: ["abbrev"],
                seasonAttrs: ["won", "lost"],
                stats: ["gp", "fg", "fga", "fgp", "tp", "tpa", "tpp", "ft", "fta", "ftp", "orb", "drb", "trb", "ast", "tov", "stl", "blk", "pf", "pts", "oppPts", "diff"],
                season: inputs.season
            }).then(function (teams) {
                return {
                    season: inputs.season,
                    teams: teams
                };
            });
        }
    }

    function uiFirst(vm) {
        ko.computed(function () {
            ui.title("Team Stats - " + vm.season());
        }).extend({throttle: 1});

        ko.computed(function () {
            var season;
            season = vm.season();
            ui.datatableSinglePage($("#team-stats"), 2, _.map(vm.teams(), function (t) {
                return ['<a href="' + helpers.leagueUrl(["roster", t.abbrev, season]) + '">' + t.abbrev + '</a>', String(t.gp), String(t.won), String(t.lost), helpers.round(t.fg, 1), helpers.round(t.fga, 1), helpers.round(t.fgp, 1), helpers.round(t.tp, 1), helpers.round(t.tpa, 1), helpers.round(t.tpp, 1), helpers.round(t.ft, 1), helpers.round(t.fta, 1), helpers.round(t.ftp, 1), helpers.round(t.orb, 1), helpers.round(t.drb, 1), helpers.round(t.trb, 1), helpers.round(t.ast, 1), helpers.round(t.tov, 1), helpers.round(t.stl, 1), helpers.round(t.blk, 1), helpers.round(t.pf, 1), helpers.round(t.pts, 1), helpers.round(t.oppPts, 1), helpers.round(t.diff, 1)];
            }), {
                fnRowCallback: function (nRow, aData) {
                    // Show point differential in green or red for positive or negative
                    if (aData[aData.length - 1] > 0) {
                        nRow.childNodes[nRow.childNodes.length - 1].classList.add("text-success");
                    } else if (aData[aData.length - 1] < 0) {
                        nRow.childNodes[nRow.childNodes.length - 1].classList.add("text-danger");
                    }
                }
            });
        }).extend({throttle: 1});

        ui.tableClickableRows($("#team-stats"));
    }

    function uiEvery(updateEvents, vm) {
        components.dropdown("team-stats-dropdown", ["seasons"], [vm.season()], updateEvents);
    }

    return bbgmView.init({
        id: "teamStats",
        get: get,
        InitViewModel: InitViewModel,
        mapping: mapping,
        runBefore: [updateTeams],
        uiFirst: uiFirst,
        uiEvery: uiEvery
    });
});