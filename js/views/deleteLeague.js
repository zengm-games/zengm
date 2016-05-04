const db = require('../db');
const g = require('../globals');
const ui = require('../ui');
const league = require('../core/league');
const backboard = require('backboard');
const Promise = require('bluebird');
const bbgmView = require('../util/bbgmView');
const viewHelpers = require('../util/viewHelpers');

function get(req) {
    return {
        lid: parseInt(req.params.lid, 10)
    };
}

async function post(req) {
    await league.remove(parseInt(req.params.lid, 10));
    ui.realtimeUpdate([], "/");
}

async function updateDeleteLeague(inputs) {
    await db.connectLeague(inputs.lid);
    try {
        return g.dbl.tx(["games", "players", "teamSeasons"], async tx => {
            const [numGames, numPlayers, teamSeasons, l] = await Promise.all([
                tx.games.count(),
                tx.players.count(),
                tx.teamSeasons.index("tid, season").getAll(backboard.bound([0], [0, ''])),
                g.dbm.leagues.get(inputs.lid)
            ]);

            return {
                lid: inputs.lid,
                name: l.name,
                numGames,
                numPlayers,
                numSeasons: teamSeasons.length
            };
        });
    } catch (err) {
        return {
            lid: inputs.lid,
            name: null,
            numGames: null,
            numPlayers: null,
            numSeasons: null
        };
    }
}

function uiFirst() {
    ui.title("Delete League");
}

module.exports = bbgmView.init({
    id: "deleteLeague",
    beforeReq: viewHelpers.beforeNonLeague,
    get,
    post: post,
    runBefore: [updateDeleteLeague],
    uiFirst
});
