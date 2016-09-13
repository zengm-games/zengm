import backboard from 'backboard';
import Promise from 'bluebird';
import db from '../db';
import g from '../globals';
import bbgmViewReact from '../util/bbgmViewReact';
import DeleteLeague from './views/DeleteLeague';

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

export default bbgmViewReact.init({
    id: "deleteLeague",
    inLeague: false,
    get,
    runBefore: [updateDeleteLeague],
    Component: DeleteLeague,
});
