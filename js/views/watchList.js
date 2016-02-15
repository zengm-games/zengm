'use strict';

var g = require('../globals');
var ui = require('../ui');
var freeAgents = require('../core/freeAgents');
var league = require('../core/league');
var player = require('../core/player');
var $ = require('jquery');
var ko = require('knockout');
var components = require('./components');
var bbgmView = require('../util/bbgmView');
var helpers = require('../util/helpers');

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
    if (updateEvents.indexOf("dbChange") >= 0 || updateEvents.indexOf("clearWatchList") >= 0 || updateEvents.indexOf("gameSim") >= 0 || updateEvents.indexOf("playerMovement") >= 0 || inputs.statType !== vm.statType() || inputs.playoffs !== vm.playoffs()) {
        return g.dbl.players.getAll().then(function (players) {
            players = players.filter(function (p) {
                return p.watch && typeof p.watch !== "function"; // In Firefox, objects have a "watch" function
            });
            return player.withStats(null, players, {
                statsSeasons: [g.season, g.season - 1], // For oldStats
                statsPlayoffs: inputs.playoffs === "playoffs"
            });
        }).then(function (players) {
            var i;

            players = player.filter(players, {
                attrs: ["pid", "name", "age", "injury", "tid", "abbrev", "watch", "contract", "freeAgentMood", "draft"],
                ratings: ["ovr", "pot", "skills", "pos"],
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

            // Add mood to free agent contracts
            for (i = 0; i < players.length; i++) {
                if (players[i].tid === g.PLAYER.FREE_AGENT) {
                    players[i].contract.amount = freeAgents.amountWithMood(players[i].contract.amount, players[i].freeAgentMood[g.userTid]);
                }
            }

            return {
                players: players,
                statType: inputs.statType,
                playoffs: inputs.playoffs
            };
        });
    }
}

function uiFirst(vm) {
    var clearWatchListEl;

    ui.title("Watch List");

    ko.computed(function () {
        var contract, d, i, p, players, rows;

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

                // If no playoff stats, blank them
                ["gp", "min", "fgp", "tpp", "ftp", "trb", "ast", "tov", "stl", "blk", "pts", "per", "ewa"].forEach(function (category) {
                    if (p.stats[category] === undefined) {
                        p.stats[category] = 0;
                    }
                });
            }

            if (p.tid === g.PLAYER.RETIRED) {
                contract = "Retired";
            } else if (p.tid === g.PLAYER.UNDRAFTED || p.tid === g.PLAYER.UNDRAFTED_2 || p.tid === g.PLAYER.UNDRAFTED_3) {
                contract = p.draft.year + " Draft Prospect";
            } else {
                contract = helpers.formatCurrency(p.contract.amount, "M") + ' thru ' + p.contract.exp;
            }

            rows.push([helpers.playerNameLabels(p.pid, p.name, p.injury, p.ratings.skills, p.watch), p.ratings.pos, String(p.age), '<a href="' + helpers.leagueUrl(["roster", p.abbrev]) + '">' + p.abbrev + '</a>', String(p.ratings.ovr), String(p.ratings.pot), contract, String(p.stats.gp), helpers.round(p.stats.min, d), helpers.round(p.stats.fgp, 1), helpers.round(p.stats.tpp, 1), helpers.round(p.stats.ftp, 1), helpers.round(p.stats.trb, d), helpers.round(p.stats.ast, d), helpers.round(p.stats.tov, d), helpers.round(p.stats.stl, 1), helpers.round(p.stats.blk, d), helpers.round(p.stats.pts, d), helpers.round(p.stats.per, 1), helpers.round(p.stats.ewa, 1)]);
        }

        ui.datatable($("#watch-list"), 0, rows);
    }).extend({throttle: 1});

    ui.tableClickableRows($("#watch-list"));

    clearWatchListEl = document.getElementById("clear-watch-list");
    clearWatchListEl.addEventListener("click", function () {
        var tx;

        clearWatchListEl.disabled = true;

        g.dbl.tx("players", "readwrite", function (tx) {
            return tx.players.iterate(function (p) {
                if (p.watch) {
                    p.watch = false;
                    return p;
                }
            });
        }).then(function () {
            league.updateLastDbChange();
            ui.realtimeUpdate(["clearWatchList"]);
            clearWatchListEl.disabled = false;
        });
    });
}

function uiEvery(updateEvents, vm) {
    components.dropdown("watch-list-dropdown", ["statTypes", "playoffs"], [vm.statType(), vm.playoffs()], updateEvents);
}

module.exports = bbgmView.init({
    id: "watchList",
    get: get,
    InitViewModel: InitViewModel,
    mapping: mapping,
    runBefore: [updatePlayers],
    uiFirst: uiFirst,
    uiEvery: uiEvery
});
