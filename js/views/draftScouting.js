/**
 * @name views.draftScouting
 * @namespace Scouting prospects in future drafts.
 */
define(["globals", "ui", "core/player", "lib/jquery", "lib/knockout", "lib/underscore", "views/components", "util/bbgmView", "util/helpers", "util/viewHelpers"], function (g, ui, player, $, ko, _, components, bbgmView, helpers, viewHelpers) {
    "use strict";

    var mapping;

    function addSeason(seasons, season, tid, cb) {
        g.dbl.transaction("players").objectStore("players").index("tid").getAll(tid).onsuccess = function (event) {
            var i, pa, p, players, playersAll;

            playersAll = player.filter(event.target.result, {
                attrs: ["pid", "name", "pos", "age", "watch"],
                ratings: ["ovr", "pot", "skills", "fuzz"],
                showNoStats: true,
                showRookies: true,
                fuzz: true
            });

            players = [];
            for (i = 0; i < playersAll.length; i++) {
                pa = playersAll[i];

                // Attributes
                p = {pid: pa.pid, name: pa.name, pos: pa.pos, age: pa.age, watch: pa.watch};

                // Ratings - just take the only entry
                p.ovr = pa.ratings[0].ovr;
                p.pot = pa.ratings[0].pot;
                p.skills = pa.ratings[0].skills;

                p.value = player.value(pa, {age: p.age + (season - g.season)});

                players.push(p);
            }

            // Rank prospects
            players.sort(function (a, b) { return b.value - a.value; });
            for (i = 0; i < players.length; i++) {
                players[i].rank = i + 1;players[i].rank = i + 1;
            }

            seasons.push({
                players: players,
                season: season
            });

            cb();
        };
    }

    mapping = {
        seasons: {
            create: function (options) {
                return options.data;
            }
        }
    };

    function updateDraftScouting(inputs, updateEvents) {
        var deferred, firstUndraftedTid, seasonOffset, seasons;

        if (updateEvents.indexOf("firstRun") >= 0 || updateEvents.indexOf("dbChange") >= 0) {
            deferred = $.Deferred();

            seasons = [];

            // Once a new draft class is generated, if the next season hasn't started, need to bump up year numbers
            if (g.phase < g.PHASE.FREE_AGENCY) {
                seasonOffset = 0;
            } else {
                seasonOffset = 1;
            }

            // In fantasy draft, use temp tid
            if (g.phase === g.PHASE.FANTASY_DRAFT) {
                firstUndraftedTid = g.PLAYER.UNDRAFTED_FANTASY_TEMP;
            } else {
                firstUndraftedTid = g.PLAYER.UNDRAFTED;
            }

            addSeason(seasons, g.season + seasonOffset, firstUndraftedTid, function () {
                addSeason(seasons, g.season + seasonOffset + 1, g.PLAYER.UNDRAFTED_2, function () {
                    addSeason(seasons, g.season + seasonOffset + 2, g.PLAYER.UNDRAFTED_3, function () {
                        deferred.resolve({
                            seasons: seasons
                        });
                    });
                });
            });

            return deferred.promise();
        }
    }

    function uiFirst(vm) {

        ui.title("Draft Scouting");

        ko.computed(function () {
            var i, seasons;
            seasons = vm.seasons();
            for (i = 0; i < seasons.length; i++) {
                ui.datatableSinglePage($("#draft-scouting-" + i), 4, _.map(seasons[i].players, function (p) {
                    return [String(p.rank), helpers.playerNameLabels(p.pid, p.name, undefined, p.skills, p.watch), p.pos, String(p.age), String(p.ovr), String(p.pot)];
                }));
            }
        }).extend({throttle: 1});

        ui.tableClickableRows($("#draft-scouting"));
    }

    return bbgmView.init({
        id: "draftScouting",
        mapping: mapping,
        runBefore: [updateDraftScouting],
        uiFirst: uiFirst
    });
});