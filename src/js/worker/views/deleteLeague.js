// @flow

import backboard from 'backboard';
import Promise from 'bluebird';
import {connectLeague} from '../db';
import g from '../../globals';
import bbgmViewReact from '../../util/bbgmViewReact';
import DeleteLeague from '../../ui/views/DeleteLeague';

function get(ctx) {
    return {
        lid: parseInt(ctx.params.lid, 10),
    };
}

async function updateDeleteLeague({lid}) {
    if (typeof lid !== 'number') {
        throw new Error('Invalid input for lid');
    }

    await connectLeague(lid);
    try {
        return g.dbl.tx(["games", "players", "teamSeasons"], async tx => {
            const [numGames, numPlayers, teamSeasons, l] = await Promise.all([
                tx.games.count(),
                tx.players.count(),
                tx.teamSeasons.index("tid, season").getAll(backboard.bound([0], [0, ''])),
                g.dbm.leagues.get(lid),
            ]);

            return {
                lid,
                name: l.name,
                numGames,
                numPlayers,
                numSeasons: teamSeasons.length,
            };
        });
    } catch (err) {
        return {
            lid,
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
