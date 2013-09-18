/**
 * @name views.tradingBlock
 * @namespace Trading block.
 */
define(["globals", "ui", "core/player", "lib/jquery", "lib/knockout", "lib/underscore", "util/bbgmView", "util/helpers"], function (g, ui, player, $, ko, _, bbgmView, helpers) {
    "use strict";

    var mapping;

    mapping = {
        userPicks: {
            create: function (options) {
                return options.data;
            }
        },
        userRoster: {
            create: function (options) {
                return options.data;
            }
        }
    };

    function updateUserRoster(inputs, updateEvents, vm) {
        var deferred;

        deferred = $.Deferred();

        g.dbl.transaction("players").objectStore("players").index("tid").getAll(g.userTid).onsuccess = function (event) {
            var attrs, i, ratings, stats, userRoster;

            var userPids = [];
            var userDpids = [];

            attrs = ["pid", "name", "pos", "age", "contract", "injury"];
            ratings = ["ovr", "pot", "skills"];
            stats = ["min", "pts", "trb", "ast", "per"];

            userRoster = player.filter(event.target.result, {
                attrs: attrs,
                ratings: ratings,
                stats: stats,
                season: g.season,
                tid: g.userTid,
                showNoStats: true,
                showRookies: true,
                fuzz: true
            });
            for (i = 0; i < userRoster.length; i++) {
                if (userPids.indexOf(userRoster[i].pid) >= 0) {
                    userRoster[i].selected = true;
                } else {
                    userRoster[i].selected = false;
                }
            }

            g.dbl.transaction("draftPicks").objectStore("draftPicks").index("tid").getAll(g.userTid).onsuccess = function (event) {
                var i, userPicks;

                userPicks = event.target.result;
                for (i = 0; i < userPicks.length; i++) {
                    userPicks[i].desc = userPicks[i].season + " " + (userPicks[i].round === 1 ? "first" : "second") + " round pick";
                    if (userPicks[i].tid !== userPicks[i].originalTid) {
                        userPicks[i].desc += " (from " + userPicks[i].originalAbbrev + ")";
                    }
                }

                deferred.resolve({
                    userDpids: userDpids,
                    userPicks: userPicks,
                    userPids: userPids,
                    userRoster: userRoster
                });
            };
        };

        return deferred.promise();
    }

    function uiFirst(vm) {
        var tradeable;

        ui.title("Trading Block");

        tradeable = function (userOrOther, roster) {
            var playersAndPicks;

            playersAndPicks = _.map(roster, function (p) {
                var selected;

                if (p.selected) {
                    selected = ' checked = "checked"';
                }
                return ['<input name="' + userOrOther + '-pids" type="checkbox" value="' + p.pid + '"' + selected + '>', helpers.playerNameLabels(p.pid, p.name, p.injury, p.ratings.skills), p.pos, String(p.age), String(p.ratings.ovr), String(p.ratings.pot), helpers.formatCurrency(p.contract.amount, "M") + ' thru ' + p.contract.exp, helpers.round(p.stats.min, 1), helpers.round(p.stats.pts, 1), helpers.round(p.stats.trb, 1), helpers.round(p.stats.ast, 1), helpers.round(p.stats.per, 1)];
            });

            return playersAndPicks;
        };

        ko.computed(function () {
            ui.datatableSinglePage($("#roster-user"), 5, tradeable("user", vm.userRoster()),
                                   {aoColumnDefs: [{bSortable: false, aTargets: [0]}]});
        }).extend({throttle: 1});
    }

    return bbgmView.init({
        id: "tradingBlock",
        mapping: mapping,
        runBefore: [updateUserRoster],
        uiFirst: uiFirst
    });
});