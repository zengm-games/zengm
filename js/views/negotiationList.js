/**
 * @name views.negotiationList
 * @namespace List of re-signing negotiations in progress.
 */
define(["dao", "globals", "ui", "core/freeAgents", "core/player", "lib/jquery", "lib/knockout", "lib/underscore", "util/bbgmView", "util/helpers", "util/viewHelpers"], function (dao, g, ui, freeAgents, player, $, ko, _, bbgmView, helpers, viewHelpers) {
    "use strict";

    var mapping;

    function get(req) {
        if (g.phase !== g.PHASE.RESIGN_PLAYERS) {
            return {
                redirectUrl: helpers.leagueUrl(["negotiation", -1])
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
        var deferred;

        deferred = $.Deferred();

        g.dbl.transaction("negotiations").objectStore("negotiations").getAll().onsuccess = function (event) {
            var negotiations, negotiationPids;

            negotiations = event.target.result;
            negotiationPids = _.pluck(negotiations, "pid");

            // Get all free agents, filter array based on negotiations data, pass to player.filter, augment with contract data from negotiations
            dao.players.getAll({
                index: "tid",
                key: g.PLAYER.FREE_AGENT,
                statSeasons: [g.season],
                statTid: g.userTid,
                filter: function (p) {
                    return negotiationPids.indexOf(p.pid) >= 0;
                }
            }, function (players) {
                var i, j;

                players = player.filter(players, {
                    attrs: ["pid", "name", "pos", "age", "freeAgentMood", "injury", "watch"],
                    ratings: ["ovr", "pot", "skills"],
                    stats: ["min", "pts", "trb", "ast", "per"],
                    season: g.season,
                    tid: g.userTid,
                    showNoStats: true,
                    fuzz: true
                });

                for (i = 0; i < players.length; i++) {
                    for (j = 0; j < negotiations.length; j++) {
                        if (players[i].pid === negotiations[j].pid) {
                            players[i].contract = {};
                            players[i].contract.amount = negotiations[j].player.amount / 1000;
                            players[i].contract.exp = g.season + negotiations[j].player.years;
                            break;
                        }
                    }

                    players[i].mood = player.moodColorText(players[i]);
                }

                deferred.resolve({
                    players: players
                });
            });
        };

        return deferred.promise();
    }

    function uiFirst(vm) {
        ui.title("Re-sign Players");

        ko.computed(function () {
            ui.datatable($("#negotiation-list"), 4, _.map(vm.players(), function (p) {
                var negotiateButton;
                if (freeAgents.refuseToNegotiate(p.contract.amount * 1000, p.freeAgentMood[g.userTid])) {
                    negotiateButton = "Refuses!";
                } else {
                    // This can be a plain link because the negotiation has already been started at this point.
                    negotiateButton = '<a href="' + helpers.leagueUrl(["negotiation", p.pid]) + '" class="btn btn-default btn-xs">Negotiate</a>';
                }
                return [helpers.playerNameLabels(p.pid, p.name, p.injury, p.ratings.skills, p.watch), p.pos, String(p.age), String(p.ratings.ovr), String(p.ratings.pot), helpers.round(p.stats.min, 1), helpers.round(p.stats.pts, 1), helpers.round(p.stats.trb, 1), helpers.round(p.stats.ast, 1), helpers.round(p.stats.per, 1), helpers.formatCurrency(p.contract.amount, "M") + ' thru ' + p.contract.exp, '<div title="' + p.mood.text + '" style="width: 100%; height: 21px; background-color: ' + p.mood.color + '"><span style="display: none">' + p.freeAgentMood[g.userTid] + '</span></div>', negotiateButton];
            }));
        }).extend({throttle: 1});

        ui.tableClickableRows($("#negotiation-list"));
    }

    return bbgmView.init({
        id: "negotiationList",
        get: get,
        mapping: mapping,
        runBefore: [updateNegotiationList],
        uiFirst: uiFirst
    });
});