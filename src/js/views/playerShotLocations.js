import backboard from 'backboard';
import g from '../globals';
import * as player from '../core/player';
import bbgmViewReact from '../util/bbgmViewReact';
import * as helpers from '../util/helpers';
import PlayerShotLocations from './views/PlayerShotLocations';

function get(ctx) {
    return {
        season: helpers.validateSeason(ctx.params.season),
    };
}

async function updatePlayers(inputs, updateEvents, state) {
    if (updateEvents.includes('dbChange') || (inputs.season === g.season && (updateEvents.includes('gameSim') || updateEvents.includes('playerMovement'))) || inputs.season !== state.season) {
        let players = await g.dbl.players.index('tid').getAll(backboard.lowerBound(g.PLAYER.RETIRED));
        players = await player.withStats(null, players, {statsSeasons: [inputs.season]});
        players = player.filter(players, {
            attrs: ["pid", "name", "age", "injury", "watch"],
            ratings: ["skills", "pos"],
            stats: ["abbrev", "gp", "gs", "min", "fgAtRim", "fgaAtRim", "fgpAtRim", "fgLowPost", "fgaLowPost", "fgpLowPost", "fgMidRange", "fgaMidRange", "fgpMidRange", "tp", "tpa", "tpp"],
            season: inputs.season,
        });

        return {
            season: inputs.season,
            players,
        };
    }
}

export default bbgmViewReact.init({
    id: "playerShotLocations",
    get,
    runBefore: [updatePlayers],
    Component: PlayerShotLocations,
});
