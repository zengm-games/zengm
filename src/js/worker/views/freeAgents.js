// @flow

import {PLAYER, g} from '../../common';
import {freeAgents, player, team} from '../core/';
import {getCopy, idb} from '../db';

async function updateFreeAgents(): void | {[key: string]: any} {
    const payroll = (await team.getPayroll(g.userTid))[0];
    let [userPlayers, players] = await Promise.all([
        idb.cache.players.indexGetAll('playersByTid', g.userTid),
        idb.cache.players.indexGetAll('playersByTid', PLAYER.FREE_AGENT),
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

    for (const p of players) {
        p.contract.amount = freeAgents.amountWithMood(p.contract.amount, p.freeAgentMood[g.userTid]);
        p.mood = player.moodColorText(p);
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
