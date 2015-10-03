/**
 * @name views.deleteLeague
 * @namespace Delete league form.
 */
'use strict';

var dao = require('../dao');
var db = require('../db');
var ui = require('../ui');
var league = require('../core/league');
var Promise = require('bluebird');
var bbgmView = require('../util/bbgmView');
var viewHelpers = require('../util/viewHelpers');

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

module.exports = bbgmView.init({
    id: "deleteLeague",
    beforeReq: viewHelpers.beforeNonLeague,
    get: get,
    post: post,
    runBefore: [updateDeleteLeague],
    uiFirst: uiFirst
});
