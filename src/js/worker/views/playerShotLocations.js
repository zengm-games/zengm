import g from '../../globals';
import {getCopy} from '../db';
import bbgmViewReact from '../../util/bbgmViewReact';
import * as helpers from '../../util/helpers';
import PlayerShotLocations from '../../ui/views/PlayerShotLocations';

function get(ctx) {
    return {
        season: helpers.validateSeason(ctx.params.season),
    };
}

async function updatePlayers(inputs, updateEvents, state) {
    if (updateEvents.includes('dbChange') || (inputs.season === g.season && (updateEvents.includes('gameSim') || updateEvents.includes('playerMovement'))) || inputs.season !== state.season) {
        let players;
        if (g.season === inputs.season && g.phase <= g.PHASE.PLAYOFFS) {
            players = await g.cache.indexGetAll('playersByTid', [g.PLAYER.FREE_AGENT, Infinity]);
        } else {
            // If it's not this season, get all players, because retired players could apply to the selected season
            players = await getCopy.players({activeAndRetired: true});
        }
        players = await getCopy.playersPlus(players, {
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
