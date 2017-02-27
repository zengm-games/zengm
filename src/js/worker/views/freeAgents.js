// @flow

import Promise from 'bluebird';
import {PLAYER} from '../../common';
import g from '../../globals';
import * as freeAgents from '../core/freeAgents';
import * as player from '../core/player';
import * as team from '../core/team';
import {getCopy} from '../db';

async function updateFreeAgents(): void | {[key: string]: any} {
    let [payroll, userPlayers, players] = await Promise.all([
        team.getPayroll(g.userTid).get(0),
        g.cache.indexGetAll('playersByTid', g.userTid),
        g.cache.indexGetAll('playersByTid', PLAYER.FREE_AGENT),
    ]);

    const capSpace = g.salaryCap > payroll ? (g.salaryCap - payroll) / 1000 : 0;

    players = await getCopy.playersPlus(players, {
        attrs: ["pid", "name", "age", "contract", "freeAgentMood", "injury", "watch"],
        ratings: ["ovr", "pot", "skills", "pos"],
        stats: ["min", "pts", "trb", "ast", "per"],
        season: g.season,
        showNoStats: true,
        showRookies: true,
        fuzz: true,
        oldStats: true,
    });

    for (let i = 0; i < players.length; i++) {
        players[i].contract.amount = freeAgents.amountWithMood(players[i].contract.amount, players[i].freeAgentMood[g.userTid]);
        players[i].mood = player.moodColorText(players[i]);
    }

    return {
        capSpace,
        gamesInProgress: g.gamesInProgress,
        minContract: g.minContract,
        numRosterSpots: 15 - userPlayers.length,
        phase: g.phase,
        players,
    };
}

export default {
    runBefore: [updateFreeAgents],
};
