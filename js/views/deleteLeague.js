/**
 * @name views.deleteLeague
 * @namespace Delete league form.
 */
define(["db", "globals", "ui", "core/league", "lib/jquery", "util/bbgmView", "util/helpers", "util/viewHelpers"], function (db, g, ui, league, $, bbgmView, helpers, viewHelpers) {
    "use strict";

    function get(req) {
        return {
            lid: parseInt(req.params.lid, 10)
        };
    }

    function post(req) {
        league.remove(parseInt(req.params.lid, 10), function () {
            ui.realtimeUpdate([], "/");
        });
    }

    function updateDeleteLeague(inputs, updateEvents) {
        var deferred;

        deferred = $.Deferred();
        db.connectLeague(inputs.lid, function () {
            var transaction;

            transaction = g.dbl.transaction(["games", "players", "teams"]);
            transaction.objectStore("games").count().onsuccess = function (event) {
                var numGames;

                numGames = event.target.result;

                transaction.objectStore("teams").get(0).onsuccess = function (event) {
                    var numSeasons;

                    numSeasons = event.target.result.seasons.length;

                    transaction.objectStore("players").count().onsuccess = function (event) {
                        var numPlayers;

                        numPlayers = event.target.result;

                        g.dbm.transaction("leagues").objectStore("leagues").get(inputs.lid).onsuccess = function (event) {
                            var l;

                            l = event.target.result;

                            deferred.resolve({
                                lid: inputs.lid,
                                name: l.name,
                                numGames: numGames,
                                numPlayers: numPlayers,
                                numSeasons: numSeasons
                            });
                        };
                    };
                };
            };
        });

        return deferred.promise();
    }

    function uiFirst(vm) {
        ui.title("Delete League");
    }

    return bbgmView.init({
        id: "deleteLeague",
        beforeReq: viewHelpers.beforeNonLeague,
        get: get,
        post: post,
        runBefore: [updateDeleteLeague],
        uiFirst: uiFirst
    });
});