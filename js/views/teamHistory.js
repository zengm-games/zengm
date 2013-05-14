/**
 * @name views.teamHistory
 * @namespace Team history.
 */
define(["db", "globals", "ui", "core/player", "lib/jquery", "lib/knockout", "lib/underscore", "util/bbgmView", "util/helpers", "util/viewHelpers", "views/components"], function (db, g, ui, player, $, ko, _, bbgmView, helpers, viewHelpers, components) {
    "use strict";

    var mapping;

    function get(req) {
        var inputs, out;

        inputs = {};

        inputs.show = req.params.show !== undefined ? req.params.show : "10";
        out = helpers.validateAbbrev(req.params.abbrev);
        inputs.tid = out[0];
        inputs.abbrev = out[1];

        return inputs;
    }

    mapping = {
        history: {
            create: function (options) {
                return options.data;
            }
        },
        players: {
            create: function (options) {
                return options.data;
            }
        }
    };

    function updateTeamHistory(inputs, updateEvents, vm) {
        var deferred;

        if (updateEvents.indexOf("dbChange") >= 0 || updateEvents.indexOf("firstRun") >= 0 || updateEvents.indexOf("gameSim") >= 0 || inputs.abbrev !== vm.abbrev()) {
            deferred = $.Deferred();

            g.dbl.transaction("teams").objectStore("teams").get(inputs.tid).onsuccess = function (event) {
                var abbrev, history, i, userTeam, userTeamSeason;

                userTeam = event.target.result;

                history = [];
                for (i = 0; i < userTeam.seasons.length; i++) {
                    history.push({
                        season: userTeam.seasons[i].season,
                        won: userTeam.seasons[i].won,
                        lost: userTeam.seasons[i].lost,
                        playoffRoundsWon: userTeam.seasons[i].playoffRoundsWon
                    });
                }
                history.reverse(); // Show most recent season first

                g.dbl.transaction("players").objectStore("players").index("statsTids").getAll(inputs.tid).onsuccess = function (event) {
                    var i, players;

                    players = player.filter(event.target.result, {
                        attrs: ["pid", "name", "pos", "injury"],
                        stats: ["gp", "min", "pts", "trb", "ast", "per"],
                        tid: inputs.tid
                    });

                    for (i = 0; i < players.length; i++) {
                        delete players[i].ratings;
                        delete players[i].stats;
                    }

                    deferred.resolve({
                        abbrev: inputs.abbrev,
                        history: history,
                        players: players
                    });
                };
            };

            return deferred.promise();
        }
    }

    function uiFirst(vm) {
        ui.title("Team History");

        ko.computed(function () {
            ui.datatable($("#team-history-players"), 2, _.map(vm.players(), function (p) {
                return [helpers.playerNameLabels(p.pid, p.name, p.injury, []), p.pos, String(p.careerStats.gp), helpers.round(p.careerStats.min, 1), helpers.round(p.careerStats.pts, 1), helpers.round(p.careerStats.trb, 1), helpers.round(p.careerStats.ast, 1), helpers.round(p.careerStats.per, 1)];
            }));
        }).extend({throttle: 1});
    }

    function uiEvery(updateEvents, vm) {
        components.dropdown("team-history-dropdown", ["teams"], [vm.abbrev()], updateEvents);
    }

    return bbgmView.init({
        id: "teamHistory",
        get: get,
        mapping: mapping,
        runBefore: [updateTeamHistory],
        uiFirst: uiFirst,
        uiEvery: uiEvery
    });
});