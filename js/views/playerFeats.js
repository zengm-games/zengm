/**
 * @name views.playerStats
 * @namespace Player stats table.
 */
define(["dao", "globals", "ui", "lib/jquery", "lib/knockout", "views/components", "util/bbgmView", "util/helpers"], function (dao, g, ui, $, ko, components, bbgmView, helpers) {
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
            abbrev: abbrev,
            season: helpers.validateSeason(req.params.season),
            playoffs: req.params.playoffs !== undefined ? req.params.playoffs : "regular_season"
        };
    }

    function InitViewModel() {
        this.abbrev = ko.observable();
        this.season = ko.observable();
        this.playoffs = ko.observable();
    }

    mapping = {
        players: {
            create: function (options) {
                return options.data;
            }
        }
    };

    function updatePlayers(inputs, updateEvents, vm) {
        if (updateEvents.indexOf("dbChange") >= 0 || updateEvents.indexOf("gameSim") >= 0 || inputs.abbrev !== vm.abbrev() || inputs.season !== vm.season() || inputs.playoffs !== vm.playoffs()) {

            return dao.playerFeats.getAll().then(function (feats) {
                feats.forEach(function (feat) {
                    feat.stats.trb = feat.stats.orb + feat.stats.drb;

                    feat.stats.fgp = feat.stats.fga > 0 ? 100 * feat.stats.fg / feat.stats.fga : 0;
                    feat.stats.tpp = feat.stats.tpa > 0 ? 100 * feat.stats.tp / feat.stats.tpa : 0;
                    feat.stats.ftp = feat.stats.fta > 0 ? 100 * feat.stats.ft / feat.stats.fta : 0;

                    if (feat.overtimes === 1) {
                        feat.score += " (OT)";
                    } else if (feat.overtimes > 1) {
                        feat.score += " (" + feat.overtimes + "OT)";
                    }
                });

                return {
                    players: feats,
                    abbrev: inputs.abbrev,
                    season: inputs.season,
                    playoffs: inputs.playoffs
                };
            });
        }
    }

    function uiFirst(vm) {
        ui.title("Statistical Feats");

        ko.computed(function () {
            var abbrev, i, oppAbbrev, p, players, rows;

            rows = [];
            players = vm.players();
            for (i = 0; i < vm.players().length; i++) {
                p = players[i];
                abbrev = g.teamAbbrevsCache[p.tid];
                oppAbbrev = g.teamAbbrevsCache[p.oppTid];

                rows.push([helpers.playerNameLabels(p.pid, p.name, p.injury, [], p.watch), p.pos, '<a href="' + helpers.leagueUrl(["roster", abbrev, p.season]) + '">' + abbrev + '</a>', String(p.stats.gs), helpers.round(p.stats.min, 1), helpers.round(p.stats.fg, 0), helpers.round(p.stats.fga, 0), helpers.round(p.stats.fgp, 1), helpers.round(p.stats.tp, 0), helpers.round(p.stats.tpa, 0), helpers.round(p.stats.tpp, 1), helpers.round(p.stats.ft, 0), helpers.round(p.stats.fta, 0), helpers.round(p.stats.ftp, 1), helpers.round(p.stats.orb, 0), helpers.round(p.stats.drb, 0), helpers.round(p.stats.trb, 0), helpers.round(p.stats.ast, 0), helpers.round(p.stats.tov, 0), helpers.round(p.stats.stl, 0), helpers.round(p.stats.blk, 0), helpers.round(p.stats.pf, 0), helpers.round(p.stats.pts, 0), helpers.gameScore(p.stats), '<a href="' + helpers.leagueUrl(["roster", oppAbbrev, p.season]) + '">' + oppAbbrev + '</a>', p.won ? 'W' : 'L', '<a href="' + helpers.leagueUrl(["game_log", abbrev, p.season, p.gid]) + '">' + p.score + '</a>', String(p.season), p.tid === g.userTid]);
            }

            ui.datatable($("#player-feats"), 2, rows, {
                rowCallback: function (row, data) {
                    // Highlight user's team
                    if (data[data.length - 1]) {
                        row.classList.add("info");
                    }
                }
            });
        }).extend({throttle: 1});

        ui.tableClickableRows($("#player-feats"));
    }

    function uiEvery(updateEvents, vm) {
        components.dropdown("player-feats-dropdown", ["teamsAndAll", "seasons", "playoffs"], [vm.abbrev(), vm.season(), vm.playoffs()], updateEvents);
    }

    return bbgmView.init({
        id: "playerFeats",
        get: get,
        InitViewModel: InitViewModel,
        mapping: mapping,
        runBefore: [updatePlayers],
        uiFirst: uiFirst,
        uiEvery: uiEvery
    });
});