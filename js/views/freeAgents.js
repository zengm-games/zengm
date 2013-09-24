/**
 * @name views.freeAgents
 * @namespace List of free agents.
 */
define(["db", "globals", "ui", "core/freeAgents", "core/player", "lib/jquery", "lib/knockout", "lib/underscore", "util/bbgmView", "util/helpers", "util/viewHelpers"], function (db, g, ui, freeAgents, player, $, ko, _, bbgmView, helpers, viewHelpers) {
    "use strict";

    var mapping;

    function get(req) {
        if (g.phase >= g.PHASE.AFTER_TRADE_DEADLINE && g.phase <= g.PHASE.RESIGN_PLAYERS) {
            if (g.phase === g.PHASE.RESIGN_PLAYERS) {
                return {
                    redirectUrl: helpers.leagueUrl(["negotiation"])
                };
            }

            return {
                errorMessage: "You're not allowed to sign free agents now."
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

    function updateFreeAgents() {
        var deferred, vars;

        deferred = $.Deferred();
        vars = {};

        db.getPayroll(null, g.userTid, function (payroll, contracts) {
            var capSpace;

            capSpace = (g.salaryCap - payroll) / 1000;
            if (capSpace < 0) {
                capSpace = 0;
            }

            g.dbl.transaction("players").objectStore("players").index("tid").getAll(g.PLAYER.FREE_AGENT).onsuccess = function (event) {
                var i, players;

                players = player.filter(event.target.result, {
                    attrs: ["pid", "name", "pos", "age", "contract", "freeAgentMood", "injury"],
                    ratings: ["ovr", "pot", "skills"],
                    stats: ["min", "pts", "trb", "ast", "per"],
                    season: g.season,
                    showNoStats: true,
                    showRookies: true,
                    fuzz: true,
                    oldStats: true
                });

                for (i = 0; i < players.length; i++) {
                    players[i].contract.amount = freeAgents.amountWithMood(players[i].contract.amount, players[i].freeAgentMood[g.userTid]);
                }

                vars = {
                    capSpace: capSpace,
                    players: players
                };

                deferred.resolve(vars);
            };
        });

        return deferred.promise();
    }

    function uiFirst(vm) {
        ui.title("Free Agents");

        $("#help-salary-cap").clickover({
            title: "Cap Space",
            html: true,
            content: "<p>\"Cap space\" is the difference between your current payroll and the salary cap. You can sign a free agent to any valid contract as long as you don't go over the cap.</p>You can only exceed the salary cap to sign free agents to minimum contracts ($" + g.minContract + "k/year)."
        });

        ko.computed(function () {
            ui.datatable($("#free-agents"), 4, _.map(vm.players(), function (p) {
                var negotiateButton;
                if (freeAgents.refuseToNegotiate(p.contract.amount * 1000, p.freeAgentMood[g.userTid])) {
                    negotiateButton = "Refuses!";
                } else {
                    negotiateButton = '<form action="' + helpers.leagueUrl(["negotiation", p.pid], {noQueryString: true}) + '" method="POST" style="margin: 0"><input type="hidden" name="new" value="1"><button type="submit" class="btn btn-default btn-xs">Negotiate</button></form>';
                }
                return [helpers.playerNameLabels(p.pid, p.name, p.injury, p.ratings.skills), p.pos, String(p.age), String(p.ratings.ovr), String(p.ratings.pot), helpers.round(p.stats.min, 1), helpers.round(p.stats.pts, 1), helpers.round(p.stats.trb, 1), helpers.round(p.stats.ast, 1), helpers.round(p.stats.per, 1), helpers.formatCurrency(p.contract.amount, "M") + ' thru ' + p.contract.exp, negotiateButton];
            }));
        }).extend({throttle: 1});
    }

    return bbgmView.init({
        id: "freeAgents",
        get: get,
        mapping: mapping,
        runBefore: [updateFreeAgents],
        uiFirst: uiFirst
    });
});