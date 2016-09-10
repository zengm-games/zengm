const db = require('../db');
const g = require('../globals');
const backboard = require('backboard');
const Promise = require('bluebird');
const bbgmViewReact = require('../util/bbgmViewReact');
const DeleteLeague = require('./views/DeleteLeague');

function get(req) {
    return {
        lid: parseInt(req.params.lid, 10),
    };
}

async function updateDeleteLeague(inputs) {
    await db.connectLeague(inputs.lid);
    try {
        return g.dbl.tx(["games", "players", "teamSeasons"], async tx => {
            const [numGames, numPlayers, teamSeasons, l] = await Promise.all([
                tx.games.count(),
                tx.players.count(),
                tx.teamSeasons.index("tid, season").getAll(backboard.bound([0], [0, ''])),
                g.dbm.leagues.get(inputs.lid),
            ]);

            return {
                lid: inputs.lid,
                name: l.name,
                numGames,
                numPlayers,
                numSeasons: teamSeasons.length,
            };
        });
    } catch (err) {
        return {
            lid: inputs.lid,
            name: undefined,
            numGames: undefined,
            numPlayers: undefined,
            numSeasons: undefined,
        };
    }
}

module.exports = bbgmViewReact.init({
    id: "deleteLeague",
    inLeague: false,
    get,
    runBefore: [updateDeleteLeague],
    Component: DeleteLeague,
});
