/**
 * @name views.historyAll
 * @namespace Single table summary of all past seasons, leaguewide.
 */
define(["globals", "ui", "core/player", "core/team", "lib/jquery", "lib/knockout", "util/bbgmView", "util/helpers", "util/viewHelpers", "views/components"], function (g, ui, player, team, $, ko, bbgmView, helpers, viewHelpers, components) {
    "use strict";

    var mapping;

    mapping = {
        seasons: {
            create: function (options) {
                return options.data;
            }
        }
    };

    function updateHistory(inputs, updateEvents, vm) {
        var deferred, tx;

        if (updateEvents.indexOf("firstRun") >= 0) {
            deferred = $.Deferred();

            tx = g.dbl.transaction(["awards", "teams"]);

            tx.objectStore("awards").getAll().onsuccess = function (event) {
                var awards, i, seasons;

                awards = event.target.result;

                seasons = [];
                for (i = 0; i < awards.length; i++) {
                    seasons[i] = {
                        season: awards[i].season,
                        finalsMvp: awards[i].finalsMvp,
                        mvp: awards[i].mvp,
                        dpoy: awards[i].dpoy,
                        roy: awards[i].roy
                    };
                }

                tx.objectStore("teams").openCursor().onsuccess = function (event) {
                    var cursor, i, t;

                    cursor = event.target.result;
                    if (cursor) {
                        t = cursor.value;

                        // t.seasons has same season entries as the "seasons" array built from awards
                        for (i = 0; i < t.seasons.length; i++) {
                            if (t.seasons[i].playoffRoundsWon === 4) {
                                seasons[i].champ = {
                                    abbrev: t.abbrev,
                                    region: t.region,
                                    name: t.name,
                                    won: t.seasons[i].won,
                                    lost: t.seasons[i].lost
                                };
                            } else if (t.seasons[i].playoffRoundsWon === 3) {
                                seasons[i].runnerUp = {
                                    abbrev: t.abbrev,
                                    region: t.region,
                                    name: t.name,
                                    won: t.seasons[i].won,
                                    lost: t.seasons[i].lost
                                };
                            }
                        }

                        cursor.continue();
                    } else {
                        deferred.resolve({
                            seasons: seasons
                        });
                    }
                };
            };

            return deferred.promise();
        }
    }

    function uiFirst(vm) {
        var awardName, teamName;

        ui.title("League History");

        awardName = function (award, season) {
            return helpers.playerNameLabels(award.pid, award.name) + ' (<a href="' + helpers.leagueUrl(["roster", g.teamAbbrevsCache[award.tid], season]) + '">' + g.teamAbbrevsCache[award.tid] + '</a>)';
        };
        teamName = function (t, season) {
            return '<a href="' + helpers.leagueUrl(["roster", t.abbrev, season]) + '">' + t.region + '</a> (' + t.won + '-' + t.lost + ')';
        };

        ko.computed(function () {
            ui.datatable($("#history-all"), 0, _.map(vm.seasons(), function (s) {
                return ['<a href="' + helpers.leagueUrl(["history", s.season]) + '">' + s.season + '</a>', teamName(s.champ, s.season), teamName(s.runnerUp, s.season), awardName(s.finalsMvp, s.season), awardName(s.mvp, s.season), awardName(s.dpoy, s.season), awardName(s.roy, s.season)];
            }));
        }).extend({throttle: 1});
    }

    return bbgmView.init({
        id: "historyAll",
        mapping: mapping,
        runBefore: [updateHistory],
        uiFirst: uiFirst
    });
});