/**
 * @name views.negotiationList
 * @namespace List of resigning negotiations in progress.
 */
define(["db", "globals", "ui", "core/freeAgents", "lib/jquery", "lib/knockout", "lib/underscore", "util/bbgmView", "util/helpers", "util/viewHelpers"], function (db, g, ui, freeAgents, $, ko, _, bbgmView, helpers, viewHelpers) {
    "use strict";

    var mapping;

    function get(req) {
        if (g.phase !== g.PHASE.RESIGN_PLAYERS) {
            return {
                redirectUrl: "/l/" + g.lid + "/negotiation/-1"
            };
        }
    }

    mapping = {
        players: {
            create: function (options) {
                return options.data;
            }
        }
    };

    function updateNegotiationList() {
        var deferred, vars;

        deferred = $.Deferred();
        vars = {};

        g.dbl.transaction("negotiations").objectStore("negotiations").getAll().onsuccess = function (event) {
            var negotiations;

            negotiations = event.target.result;

            // Get all free agents, filter array based on negotiations data, pass to db.getPlayers, augment with contract data from negotiations
            g.dbl.transaction("players").objectStore("players").index("tid").getAll(g.PLAYER.FREE_AGENT).onsuccess = function (event) {
                var attributes, data, i, j, players, playersAll, playersSome, ratings, stats;

                playersAll = event.target.result;
                playersSome = [];
                for (i = 0; i < playersAll.length; i++) {
                    for (j = 0; j < negotiations.length; j++) {
                        if (playersAll[i].pid === negotiations[j].pid) {
                            playersSome.push(playersAll[i]);
                            break;
                        }
                    }
                }

                attributes = ["pid", "name", "pos", "age", "freeAgentMood", "injury"];
                stats = ["min", "pts", "trb", "ast", "per"];
                ratings = ["ovr", "pot", "skills"];
                players = db.getPlayers(playersSome, g.season, g.userTid, attributes, stats, ratings, {sortBy: "rosterOrder", showNoStats: true, fuzz: true});

                for (i = 0; i < players.length; i++) {
                    for (j = 0; j < negotiations.length; j++) {
                        if (players[i].pid === negotiations[j].pid) {
                            players[i].contract = {};
                            players[i].contract.amount = negotiations[j].player.amount / 1000;
                            players[i].contract.exp = g.season + negotiations[j].player.years;
                            break;
                        }
                    }
                }

                vars = {
                    players: players
                };

                deferred.resolve(vars);
            };
        };

        return deferred.promise();
    }

    function uiFirst(vm) {
        ui.title("Resign Players");

        ko.computed(function () {
            ui.datatable($("#negotiation-list"), 4, _.map(vm.players(), function (p) {
                var negotiateButton;
                if (freeAgents.refuseToNegotiate(p.contract.amount * 1000, p.freeAgentMood[g.userTid])) {
                    negotiateButton = "Refuses!";
                } else {
                    // This can be a plain link because the negotiation has already been started at this point.
                    negotiateButton = '<a href="/l/' + g.lid + '/negotiation/' + p.pid + '" class="btn btn-mini btn-primary">Negotiate</a>';
                }
                return [helpers.playerNameLabels(p.pid, p.name, p.injury, p.ratings.skills), p.pos, String(p.age), String(p.ratings.ovr), String(p.ratings.pot), helpers.round(p.stats.min, 1), helpers.round(p.stats.pts, 1), helpers.round(p.stats.trb, 1), helpers.round(p.stats.ast, 1), helpers.round(p.stats.per, 1), helpers.formatCurrency(p.contract.amount, "M") + ' thru ' + p.contract.exp, negotiateButton];
            }));
        }).extend({throttle: 1});
    }

    return bbgmView.init({
        id: "negotiationList",
        get: get,
        mapping: mapping,
        runBefore: [updateNegotiationList],
        uiFirst: uiFirst
    });
});