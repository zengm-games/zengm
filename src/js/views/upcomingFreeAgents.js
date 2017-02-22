import backboard from 'backboard';
import g from '../globals';
import * as player from '../core/player';
import {getCopy} from '../db';
import bbgmViewReact from '../util/bbgmViewReact';
import * as helpers from '../util/helpers';
import UpcomingFreeAgents from './views/UpcomingFreeAgents';

function get(ctx) {
    let season = helpers.validateSeason(ctx.params.season);

    if (g.phase <= g.PHASE.RESIGN_PLAYERS) {
        if (season < g.season) {
            season = g.season;
        }
    } else if (season < g.season + 1) {
        season = g.season + 1;
    }

    return {
        season,
    };
}

async function updateUpcomingFreeAgents(inputs) {
    let players = await g.dbl.players.index('tid').getAll(backboard.lowerBound(0));
    players = players.filter(p => p.contract.exp === inputs.season);

    // Done before filter so full player object can be passed to player.genContract.
    for (let i = 0; i < players.length; i++) {
        players[i].contractDesired = player.genContract(players[i], false, false); // No randomization
        players[i].contractDesired.amount /= 1000;
        players[i].contractDesired.exp += inputs.season - g.season;
    }

    players = await getCopy.playersPlus(players, {
        attrs: ["pid", "name", "age", "contract", "freeAgentMood", "injury", "watch", "contractDesired"],
        ratings: ["ovr", "pot", "skills", "pos"],
        stats: ["min", "pts", "trb", "ast", "per"],
        season: g.season,
        showNoStats: true,
        showRookies: true,
        fuzz: true,
    });

    return {
        players,
        season: inputs.season,
    };
}

export default bbgmViewReact.init({
    id: "upcomingFreeAgents",
    get,
    runBefore: [updateUpcomingFreeAgents],
    Component: UpcomingFreeAgents,
});
