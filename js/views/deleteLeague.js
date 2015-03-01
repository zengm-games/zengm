/**
 * @name views.deleteLeague
 * @namespace Delete league form.
 */
define(["dao", "db", "ui", "core/league", "lib/bluebird", "util/bbgmView", "util/viewHelpers"], function (dao, db, ui, league, Promise, bbgmView, viewHelpers) {
    "use strict";

    function get(req) {
        return {
            lid: parseInt(req.params.lid, 10)
        };
    }

    function post(req) {
        league.remove(parseInt(req.params.lid, 10)).then(function () {
            ui.realtimeUpdate([], "/");
        });
    }

    function updateDeleteLeague(inputs) {
        return db.connectLeague(inputs.lid).then(function () {
            var tx;

            tx = dao.tx(["games", "players", "teams"]);

            return Promise.all([
                dao.games.count({ot: tx}),
                dao.players.count({ot: tx}),
                dao.teams.get({ot: tx, key: 0}),
                dao.leagues.get({key: inputs.lid})
            ]).spread(function (numGames, numPlayers, t, l) {
                var numSeasons;

                numSeasons = t.seasons.length;

                return {
                    lid: inputs.lid,
                    name: l.name,
                    numGames: numGames,
                    numPlayers: numPlayers,
                    numSeasons: numSeasons
                };
            });
        }).catch(function () {
            return {
                lid: inputs.lid,
                name: null,
                numGames: null,
                numPlayers: null,
                numSeasons: null
            };
        });
    }

    function uiFirst() {
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