/**
 * @name views.teamHistory
 * @namespace Team history.
 */
define(["db", "globals", "ui", "lib/jquery", "util/bbgmView", "util/viewHelpers"], function (db, g, ui, $, bbgmView, viewHelpers) {
    "use strict";

    var mapping;

    mapping = {
        history: {
            create: function (options) {
                return options.data;
            }
        }
    };

    function updateTeamHistory(inputs, updateEvents, vm) {
        var deferred, vars;

        if (updateEvents.indexOf("firstRun") >= 0 || updateEvents.indexOf("gameSim") >= 0) {
            deferred = $.Deferred();
            vars = {};

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

                vars = {
                    abbrev: abbrev,
                    history: history
                };

                deferred.resolve(vars);
            };

            return deferred.promise();
        }
    }

    function uiFirst() {
        ui.title("Team History");
    }

    return bbgmView.init({
        id: "teamHistory",
        mapping: mapping,
        runBefore: [updateTeamHistory],
        uiFirst: uiFirst
    });
});