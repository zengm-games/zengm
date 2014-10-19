/**
 * @name views.history
 * @namespace Summaries of past seasons, leaguewide.
 */
define(["dao", "globals", "ui", "core/player", "core/team", "lib/jquery", "lib/knockout", "util/bbgmView", "util/helpers", "util/viewHelpers", "views/components"], function (dao, g, ui, player, team, $, ko, bbgmView, helpers, viewHelpers, components) {
    "use strict";

    function get(req) {
        var season;

        season = helpers.validateSeason(req.params.season);

        // If playoffs aren't over, season awards haven't been set
        if (g.phase <= g.PHASE.PLAYOFFS) {
            // View last season by default
            if (season === g.season) {
                season -= 1;
            }
        }

        if (season < g.startingSeason) {
            return {
                errorMessage: "There is no league history yet. Check back after the playoffs."
            };
        }

        return {
            season: season
        };
    }

    function updateHistory(inputs, updateEvents, vm) {
        var deferred;

        if (updateEvents.indexOf("dbChange") >= 0 || updateEvents.indexOf("firstRun") >= 0 || vm.season() !== inputs.season) {
            deferred = $.Deferred();

            g.dbl.transaction("awards").objectStore("awards").get(inputs.season).onsuccess = function (event) {
                var awards;

                awards = event.target.result;

                // Hack placeholder for old seasons before Finals MVP existed
                if (!awards.hasOwnProperty("finalsMvp")) {
                    awards.finalsMvp = {
                        pid: 0,
                        name: "N/A",
                        pts: 0,
                        trb: 0,
                        ast: 0
                    };
                }

                dao.players.getAll({
                    index: "retiredYear",
                    key: inputs.season,
                    statsSeasons: []
                }, function (retiredPlayers) {
                    var i;

                    retiredPlayers = player.filter(retiredPlayers, {
                        attrs: ["pid", "name", "age", "hof"],
                        season: inputs.season
                    });
                    for (i = 0; i < retiredPlayers.length; i++) {
                        // Show age at retirement, not current age
                        retiredPlayers[i].age -= g.season - inputs.season;
                    }
                    retiredPlayers.sort(function (a, b) { return b.age - a.age; });

                    team.filter({
                        attrs: ["abbrev", "region", "name"],
                        seasonAttrs: ["playoffRoundsWon"],
                        season: inputs.season
                    }, function (teams) {
                        var champ, i;

                        for (i = 0; i < teams.length; i++) {
                            if (teams[i].playoffRoundsWon === 4) {
                                champ = teams[i];
                                break;
                            }
                        }
                        champ.tid = g.teamAbbrevsCache.indexOf(champ.abbrev);

                        deferred.resolve({
                            awards: awards,
                            champ: champ,
                            retiredPlayers: retiredPlayers,
                            season: inputs.season,
                            userTid: g.userTid
                        });
                    });
                });
            };

            return deferred.promise();
        }
    }

    function uiFirst(vm) {
        ko.computed(function () {
            ui.title("Season Summary - " + vm.season());
        }).extend({throttle: 1});
    }

    function uiEvery(updateEvents, vm) {
        components.dropdown("history-dropdown", ["seasons"], [vm.season()], updateEvents);
    }

    return bbgmView.init({
        id: "history",
        get: get,
        runBefore: [updateHistory],
        uiFirst: uiFirst,
        uiEvery: uiEvery
    });
});