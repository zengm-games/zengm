'use strict';

var db = require('../db');
var g = require('../globals');
var ui = require('../ui');
var league = require('../core/league');
var backboard = require('backboard');
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
        return g.dbl.tx(["games", "players", "teamSeasons"], function (tx) {
            return Promise.all([
                tx.games.count(),
                tx.players.count(),
                tx.teamSeasons.index("tid, season").getAll(backboard.bound([0], [0, ''])),
                g.dbm.leagues.get(inputs.lid)
            ]).spread(function (numGames, numPlayers, teamSeasons, l) {
                var numSeasons;

                numSeasons = teamSeasons.length;

                return {
                    lid: inputs.lid,
                    name: l.name,
                    numGames: numGames,
                    numPlayers: numPlayers,
                    numSeasons: numSeasons
                };
            });
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
