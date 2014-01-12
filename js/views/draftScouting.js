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
                attrs: ["pid", "name", "pos", "age"],
                ratings: ["ovr", "pot", "skills", "fuzz"],
                showNoStats: true,
                showRookies: true,
                fuzz: true
            });

            players = [];
            for (i = 0; i < playersAll.length; i++) {
                pa = playersAll[i];

                // Attributes
                p = {pid: pa.pid, name: pa.name, pos: pa.pos, age: pa.age};

                // Ratings - just take the only entry
                p.ovr = pa.ratings[0].ovr;
                p.pot = pa.ratings[0].pot;
                p.skills = pa.ratings[0].skills;

                p.value = player.value(pa, {fuzz: true, age: p.age + (season - g.season)});

                players.push(p);
            }

            // Rank prospects
            players.sort(function (a, b) { return b.value - a.value; });
            for (i = 0; i < players.length; i++) {
                players[i].rank = i + 1;
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
        var deferred, seasonOffset, seasons;

        if (updateEvents.indexOf("firstRun") >= 0) {
            deferred = $.Deferred();

            seasons = [];

            // Once a new draft class is generated, if the next season hasn't started, need to bump up year numbers
            if (g.phase < g.PHASE.FREE_AGENCY) {
                seasonOffset = 0;
            } else {
                seasonOffset = 1;
            }

            addSeason(seasons, g.season + seasonOffset, g.PLAYER.UNDRAFTED, function () {
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
        var i, seasons;

        ui.title("Draft Scouting");

        seasons = vm.seasons();
        for (i = 0; i < seasons.length; i++) {
            ui.datatableSinglePage($("#draft-scouting-" + i), 4, _.map(seasons[i].players, function (p) {
                return [String(p.rank), helpers.playerNameLabels(p.pid, p.name, undefined, p.skills), p.pos, String(p.age), String(p.ovr), String(p.pot)];
            }));
        }

        ui.tableClickableRows($("#draft-scouting"));
    }

    return bbgmView.init({
        id: "draftScouting",
        mapping: mapping,
        runBefore: [updateDraftScouting],
        uiFirst: uiFirst
    });
});