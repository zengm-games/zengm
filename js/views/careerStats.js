/**
 * @name views.careerStats
 * @namespace Career stats table.
 */
define(["globals", "ui", "core/player", "lib/jquery", "lib/knockout", "lib/underscore", "views/components", "util/bbgmView", "util/helpers", "util/viewHelpers"], function (g, ui, player, $, ko, _, components, bbgmView, helpers, viewHelpers) {
    "use strict";

    var mapping;

    function get(req) {
        return {
            playoffs: req.params.playoffs !== undefined ? req.params.playoffs : "regular_season",
            statType: req.params.statType !== undefined ? req.params.statType : "per_game"
        };
    }

    function InitViewModel() {
        this.statType = ko.observable();
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
        var deferred;

        if (updateEvents.indexOf("firstRun") >= 0 || updateEvents.indexOf("dbChange") >= 0 || updateEvents.indexOf("gameSim") >= 0 || updateEvents.indexOf("playerMovement") >= 0 || inputs.statType !== vm.statType()) {
            deferred = $.Deferred();

            g.dbl.transaction("players").objectStore("players").getAll().onsuccess = function (event) {
                var i, players;

                players = player.filter(event.target.result, {
                    attrs: ["pid", "name", "pos", "age", "hof", "tid"],
                    stats: ["abbrev", "gp", "gs", "min", "fg", "fga", "fgp", "tp", "tpa", "tpp", "ft", "fta", "ftp", "orb", "drb", "trb", "ast", "tov", "stl", "blk", "pf", "pts", "per", "ewa"],
                    totals: inputs.statType === "totals",
                    per36: inputs.statType === "per_36",
                    playoffs: inputs.playoffs === "playoffs"
                });

                for (i = 0; i < players.length; i++) {
                    delete players[i].ratings;
                    delete players[i].stats;
                }

                deferred.resolve({
                    players: players,
                    playoffs: inputs.playoffs,
                    statType: inputs.statType
                });
            };
            return deferred.promise();
        }
    }

    function uiFirst(vm) {
        ui.title("Career Stats");

        ko.computed(function () {
            ui.datatable($("#career-stats"), 2, _.map(vm.players(), function (p) {
                // HACK due to ugly player.filter API
                if (vm.playoffs() === "playoffs") {
                    p.careerStats = p.careerStatsPlayoffs;
                }

                if (vm.statType() !== "totals") {
                    return [helpers.playerNameLabels(p.pid, p.name), p.pos, String(p.careerStats.gp), String(p.careerStats.gs), helpers.round(p.careerStats.min, 1), helpers.round(p.careerStats.fg, 1), helpers.round(p.careerStats.fga, 1), helpers.round(p.careerStats.fgp, 1), helpers.round(p.careerStats.tp, 1), helpers.round(p.careerStats.tpa, 1), helpers.round(p.careerStats.tpp, 1), helpers.round(p.careerStats.ft, 1), helpers.round(p.careerStats.fta, 1), helpers.round(p.careerStats.ftp, 1), helpers.round(p.careerStats.orb, 1), helpers.round(p.careerStats.drb, 1), helpers.round(p.careerStats.trb, 1), helpers.round(p.careerStats.ast, 1), helpers.round(p.careerStats.tov, 1), helpers.round(p.careerStats.stl, 1), helpers.round(p.careerStats.blk, 1), helpers.round(p.careerStats.pf, 1), helpers.round(p.careerStats.pts, 1), helpers.round(p.careerStats.per, 1), helpers.round(p.careerStats.ewa, 1), p.hof, p.tid > g.PLAYER.RETIRED && p.tid !== g.userTid, p.tid === g.userTid];
                } else {
                    return [helpers.playerNameLabels(p.pid, p.name), p.pos, String(p.careerStats.gp), String(p.careerStats.gs), helpers.round(p.careerStats.min, 0), String(p.careerStats.fg), String(p.careerStats.fga), helpers.round(p.careerStats.fgp, 1), String(p.careerStats.tp), String(p.careerStats.tpa), helpers.round(p.careerStats.tpp, 1), String(p.careerStats.ft), String(p.careerStats.fta), helpers.round(p.careerStats.ftp, 1), String(p.careerStats.orb), String(p.careerStats.drb), String(p.careerStats.trb), String(p.careerStats.ast), String(p.careerStats.tov), String(p.careerStats.stl), String(p.careerStats.blk), String(p.careerStats.pf), String(p.careerStats.pts), helpers.round(p.careerStats.per, 1), helpers.round(p.careerStats.ewa, 1), p.hof, p.tid > g.PLAYER.RETIRED && p.tid !== g.userTid, p.tid === g.userTid];
                }
            }), {
                fnRowCallback: function (nRow, aData) {
                    // Highlight active players
                    if (aData[aData.length - 1]) {
                        nRow.classList.add("success"); // On this team
                    } else if (aData[aData.length - 2]) {
                        nRow.classList.add("info"); // On other team
                    } else if (aData[aData.length - 3]) {
                        nRow.classList.add("danger"); // Hall of Fame
                    }
                }
            });
        }).extend({throttle: 1});

        ui.tableClickableRows($("#career-stats"));
    }

    function uiEvery(updateEvents, vm) {
        components.dropdown("career-stats-dropdown", ["statTypes", "playoffs"], [vm.statType(), vm.playoffs()], updateEvents);
    }

    return bbgmView.init({
        id: "careerStats",
        get: get,
        InitViewModel: InitViewModel,
        mapping: mapping,
        runBefore: [updatePlayers],
        uiFirst: uiFirst,
        uiEvery: uiEvery
    });
});