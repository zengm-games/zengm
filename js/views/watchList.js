/**
 * @name views.watchList
 * @namespace List of players to watch.
 */
define(["globals", "ui", "core/player", "lib/jquery", "lib/knockout", "views/components", "util/bbgmView", "util/helpers"], function (g, ui, player, $, ko, components, bbgmView, helpers) {
    "use strict";

    var mapping;

    function get(req) {
        return {
            statType: req.params.statType !== undefined ? req.params.statType : "per_game",
            playoffs: req.params.playoffs !== undefined ? req.params.playoffs : "regular_season"
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
        var deferred, playersUnfiltered;

        if (updateEvents.indexOf("dbChange") >= 0 || updateEvents.indexOf("watchList") >= 0 || updateEvents.indexOf("gameSim") >= 0 || updateEvents.indexOf("playerMovement") >= 0 || inputs.statType !== vm.statType() || inputs.playoffs !== vm.playoffs()) {
            deferred = $.Deferred();

            playersUnfiltered = [];

            // Can't index on a boolean in IndexedDB, so loop through them all
            g.dbl.transaction("players").objectStore("players").openCursor().onsuccess = function (event) {
                var cursor, p, players;

                cursor = event.target.result;
                if (cursor) {
                    p = cursor.value;
                    if (p.watch) {
                        playersUnfiltered.push(p);
                    }
                    cursor.continue();
                } else {
console.log(playersUnfiltered)
                    players = player.filter(playersUnfiltered, {
                        attrs: ["pid", "name", "pos", "age", "injury", "abbrev", "watch", "contract"],
                        ratings: ["ovr", "pot", "skills"],
                        stats: ["gp", "min", "fgp", "tpp", "ftp", "trb", "ast", "tov", "stl", "blk", "pts", "per", "ewa"],
                        season: g.season,
                        totals: inputs.statType === "totals",
                        per36: inputs.statType === "per_36",
                        playoffs: inputs.playoffs === "playoffs",
                        fuzz: true,
                        showNoStats: true,
                        showRookies: true,
                        showRetired: true,
                        oldStats: true
                    });
console.log(playersUnfiltered)

                    deferred.resolve({
                        players: players,
                        statType: inputs.statType,
                        playoffs: inputs.playoffs
                    });
                }
            };
            return deferred.promise();
        }
    }

    function uiFirst(vm) {
        ui.title("Watch List");

        ko.computed(function () {
            var abbrev, d, i, p, players, rows;

            // Number of decimals for many stats
            if (vm.statType() === "totals") {
                d = 0;
            } else {
                d = 1;
            }

            rows = [];
            players = vm.players();
            for (i = 0; i < vm.players().length; i++) {
                p = players[i];

                // HACKS to show right stats, info
                if (vm.playoffs() === "playoffs") {
                    p.stats = p.statsPlayoffs;
                }

                rows.push([helpers.playerNameLabels(p.pid, p.name, p.injury, p.ratings.skills, p.watch), p.pos, String(p.age), '<a href="' + helpers.leagueUrl(["roster", p.abbrev]) + '">' + p.abbrev + '</a>', String(p.ratings.ovr), String(p.ratings.pot), helpers.formatCurrency(p.contract.amount, "M") + ' thru ' + p.contract.exp, String(p.stats.gp), helpers.round(p.stats.min, d), helpers.round(p.stats.fgp, 1), helpers.round(p.stats.tpp, 1), helpers.round(p.stats.ftp, 1), helpers.round(p.stats.trb, d), helpers.round(p.stats.ast, d), helpers.round(p.stats.tov, d), helpers.round(p.stats.stl, 1), helpers.round(p.stats.blk, d), helpers.round(p.stats.pts, d), helpers.round(p.stats.per, 1), helpers.round(p.stats.ewa, 1)]);
            }

            ui.datatable($("#watch-list"), 0, rows);
        }).extend({throttle: 1});

        ui.tableClickableRows($("#watch-list"));
    }

    function uiEvery(updateEvents, vm) {
        components.dropdown("watch-list-dropdown", ["statTypes", "playoffs"], [vm.statType(), vm.playoffs()], updateEvents);
    }

    return bbgmView.init({
        id: "watchList",
        get: get,
        InitViewModel: InitViewModel,
        mapping: mapping,
        runBefore: [updatePlayers],
        uiFirst: uiFirst,
        uiEvery: uiEvery
    });
});