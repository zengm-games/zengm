import backboard from 'backboard';
import g from '../../globals';
import * as player from '../core/player';
import {getCopy, idb} from '../db';
import type {GetOutput} from '../../common/types';

async function updateUpcomingFreeAgents(
    inputs: GetOutput,
): void | {[key: string]: any} {
    let players = await idb.league.players.index('tid').getAll(backboard.lowerBound(0));
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

export default {
    runBefore: [updateUpcomingFreeAgents],
};
