/**
 * @name views.teamHistory
 * @namespace Team history.
 */
define(["db", "globals", "ui", "core/player", "lib/jquery", "lib/knockout", "lib/underscore", "util/bbgmView", "util/helpers", "util/viewHelpers"], function (db, g, ui, player, $, ko, _, bbgmView, helpers, viewHelpers) {
    "use strict";

    var mapping;

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

        if (updateEvents.indexOf("dbChange") >= 0 || updateEvents.indexOf("firstRun") >= 0 || updateEvents.indexOf("gameSim") >= 0) {
            deferred = $.Deferred();

            g.dbl.transaction("teams").objectStore("teams").get(g.userTid).onsuccess = function (event) {
                var abbrev, extraText, history, i, userTeam, userTeamSeason;

                userTeam = event.target.result;

                abbrev = userTeam.abbrev;

                history = [];
                for (i = 0; i < userTeam.seasons.length; i++) {
                    extraText = "";
                    if (userTeam.seasons[i].playoffRoundsWon === 4) {
                        extraText = "league champs";
                    } else if (userTeam.seasons[i].playoffRoundsWon === 3) {
                        extraText = "conference champs";
                    } else if (userTeam.seasons[i].playoffRoundsWon === 2) {
                        extraText = "made conference finals";
                    } else if (userTeam.seasons[i].playoffRoundsWon === 1) {
                        extraText = "made second round";
                    } else if (userTeam.seasons[i].playoffRoundsWon === 0) {
                        extraText = "made playoffs";
                    }

                    history.push({
                        season: userTeam.seasons[i].season,
                        won: userTeam.seasons[i].won,
                        lost: userTeam.seasons[i].lost,
                        extraText: extraText
                    });
                }
                history.reverse(); // Show most recent season first

                g.dbl.transaction("players").objectStore("players").index("statsTids").getAll(g.userTid).onsuccess = function (event) {
                    var i, players;

                    players = player.filter(event.target.result, {
                        attrs: ["pid", "name", "pos", "injury"],
                        stats: ["gp", "min", "pts", "trb", "ast", "per"],
                        tid: g.userTid
                    });

                    for (i = 0; i < players.length; i++) {
                        delete players[i].ratings;
                        delete players[i].stats;
                    }
console.log(players);

                    deferred.resolve({
                        abbrev: abbrev,
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

    return bbgmView.init({
        id: "teamHistory",
        mapping: mapping,
        runBefore: [updateTeamHistory],
        uiFirst: uiFirst
    });
});